import { base32 } from 'multiformats/bases/base32'
import { varint } from '@synonymdev/slashtags-common'
import { base58btc } from 'multiformats/bases/base58'
import { JsonRpcEngine } from 'json-rpc-engine'
import { createAuth } from '@synonymdev/slashtags-auth'
import { randomBytes } from 'crypto'
import URI from 'urijs'

/**
 *
 * @param {Object} opts
 * @param {string} [opts.baseURL]
 * @param {import('ws').WebSocketServer} [opts.wss]
 * @param {*} [opts.metadata]
 * @param {*} [opts.keyPair]
 * @returns
 */
export const SlashtagsAccounts = ({ wss, baseURL, metadata, keyPair }) => {
  const auth = createAuth(keyPair, { metadata })

  if (!wss) throw new Error('wss must be provided')

  // Tickets callbacks correlation
  const callbacksMap = new Map()

  const engine = new JsonRpcEngine()

  wss.on('connection', (socket, request) => {
    socket.onmessage = ({ target, data }) => {
      try {
        const json = JSON.parse(data.toString())

        engine.handle(json, (err, res) => {
          socket.send(JSON.stringify(res))
        })
      } catch (error) {
        socket.send(
          JSON.stringify({ error: { code: -32700, message: 'Parse error' } })
        )
      }
    }
  })

  // Slsashtags
  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/GET_CHALLENGE') {
      const { ticket } = req.params

      const callbacks = callbacksMap.get(ticket)

      if (!callbacks) {
        end(new Error('Expired ticket'))
        return
      }

      const challenge = auth.responder.newChallenge(60 * 1000 * 5, metadata)

      res.result = {
        publicKey: keyPair.publicKey.toString('hex'),
        challenge: Buffer.from(challenge).toString('hex'),
        metadata
      }

      end()
    }
    next()
  })

  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/RESPOND') {
      const { attestation, ticket } = req.params

      try {
        const callbacks = callbacksMap.get(ticket)

        if (!callbacks) {
          end(new Error('Expired ticket'))
          return
        }

        const { metadata, initiatorPK, responderAttestation } =
          auth.responder.verifyInitiator(Buffer.from(attestation, 'hex'))

        callbacksMap.get(ticket)?.onVerify({
          metadata,
          publicKey: Buffer.from(initiatorPK).toString('hex')
        })

        res.result = {
          attestation: Buffer.from(responderAttestation).toString('hex')
        }

        callbacksMap.delete(ticket)
      } catch (error) {
        // @ts-ignore
        res.error = error.message
      }
      end()
    }
    next()
  })

  // ==========

  if (!baseURL) throw new Error('baseURL must be provided')
  const socketURL = baseURL?.replace(/^http/, 'ws')
  const address = base32.encode(
    varint.prepend([210, 0, 0], Buffer.from(socketURL))
  )

  return {
    /**
     *
     * @param {object} opts
     * @param {()=>void} opts.onVerify
     * @param {number} [opts.timeout]
     * @returns
     */
    generateURL: ({ onVerify, timeout = 2 * 60 * 1000 }) => {
      const url = new URI({
        protocol: 'slash',
        hostname: address
      })

      url.addQuery('act', 1)

      const ticket = base58btc.encode(randomBytes(8))

      callbacksMap.set(ticket, { onVerify })

      setTimeout(() => {
        callbacksMap.delete(ticket)
      }, timeout)

      url.addQuery('tkt', ticket)

      return url.toString()
    }
  }
}
