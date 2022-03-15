import { base32 } from 'multiformats/bases/base32'
import { base58btc } from 'multiformats/bases/base58'
import {
  didKeyFromPubKey,
  sessionFingerprint,
  verifyFactory
} from './utils.js'
import { randomBytes } from 'crypto'
import { createJWS } from 'did-jwt'
import { signers } from './signers.js'
import { varint } from '@synonymdev/slashtags-common'

/**
 *
 * @param {SlashtagsRPC} node
 * @param {object} [opts]
 * @param {ResolverRegistry} [opts.didResolverRegistry]
 * @returns
 */
export const Auth = async (node, opts) => {
  // Tickets callbacks correlation
  /** @type {Map<string, TicketConfig>} */
  const _ticketConfigs = new Map()

  const destination = await node.listen()
  const address = base32.encode(varint.prepend([135, 0], destination))

  const verify = verifyFactory(opts?.didResolverRegistry)

  node.addMethods({
    ACT1_INIT: async (request) => {
      const ticket = request.params.tkt
      if (typeof ticket !== 'string') throw new Error('Missing param: tkt')

      const config = _ticketConfigs.get(ticket)
      if (!config) throw new Error(`Ticket "${ticket}" not found`)

      const sfp = await sessionFingerprint(request, ticket)

      const { responder, additionalItems } = await config.onRequest()

      config.sfp = sfp
      config.local = responder.profile

      if (!responder.profile['@id']) {
        responder.profile['@id'] = didKeyFromPubKey(
          responder.keyPair.publicKey
        )
      }

      const signer = signers[responder.keyPairType || 'ES256K'](
        responder.keyPair.secretKey
      )

      return {
        proof: await createJWS({ sfp }, signer),
        profile: responder.profile,
        additionalItems
      }
    },
    ACT1_VERIFY: async (request) => {
      const ticket = request.params.tkt
      if (typeof ticket !== 'string') throw new Error('Missing param: tkt')
      const jws = request.params.jws
      if (typeof jws !== 'string') throw new Error('Missing param: jws')

      /** @type {Profile} */
      // @ts-ignore
      const remote = request.params.profile

      if (!remote?.['@id']) throw new Error('Missing param: profile["@id"]')

      const config = _ticketConfigs.get(ticket)
      if (!config) throw new Error(`Ticket "${ticket}" not found`)

      const { sfp } = await verify(jws, remote['@id'])

      if (sfp !== config.sfp) throw new Error('Invalid session fingerprint')

      const final = await config.onSuccess?.(
        {
          // @ts-ignore
          local: config.local,
          remote
        },
        // @ts-ignore
        request.params.additionalItems
      )

      clearTimeout(config.timeout)
      _ticketConfigs.delete(ticket)

      return { status: 'OK', additionalItems: final?.additionalItems }
    }
  })

  // ==========

  return {
    _ticketConfigs,
    /**
     *
     * @param {object} opts
     * @param {OnRequest} opts.onRequest
     * @param {OnSuccess} [opts.onSuccess]
     * @param {()=>Promise<void> | void} [opts.onTimeout]
     * @param {number} [opts.timeout]
     * @returns
     */
    issueURL: ({
      onRequest,
      onSuccess,
      onTimeout,
      timeout = 2 * 60 * 1000
    }) => {
      const ticket = base58btc.encode(randomBytes(8))

      /** @type {TicketConfig} */
      const config = _ticketConfigs.get(ticket) || {
        onRequest,
        onSuccess,
        timeout: setTimeout(async () => {
          _ticketConfigs.delete(ticket)
          await onTimeout?.()
        }, timeout)
      }

      _ticketConfigs.set(ticket, config)

      return 'slash://' + address + '?act=1&tkt=' + ticket
    }
  }
}

/** @typedef {import('./interfaces').SlashtagsRPC} SlashtagsRPC */
/** @typedef {import('did-jwt').Signer} Signer */
/** @typedef {import('./interfaces').OnSuccess} OnSuccess */
/** @typedef {import('./interfaces').TicketConfig} TicketConfig */
/** @typedef {import('./interfaces').OnRequest} OnRequest */
/** @typedef {import('./interfaces').Profile} Profile */
/** @typedef {import('@synonymdev/slashtags-common').JsonLdObject} JsonLdObject */
/** @typedef {import('did-resolver').ResolverRegistry} ResolverRegistry */
