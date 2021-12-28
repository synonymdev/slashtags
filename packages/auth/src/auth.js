import { base32 } from 'multiformats/bases/base32'
import { base58btc } from 'multiformats/bases/base58'
import { didKeyFromPubKey, sessionFingerprint, verifyJWS } from './utils.js'
import { randomBytes } from 'crypto'
import { createJWS } from 'did-jwt'
import { signers } from './signers.js'
import { varint } from '@synonymdev/slashtags-common'
import { Resolver } from 'did-resolver'
import keyresolver from 'key-did-resolver'

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

  const registry = {
    ...keyresolver.getResolver(),
    ...opts?.didResolverRegistry
  }
  const supportedMethods = Object.keys(registry)
  const resolver = new Resolver(registry)

  node.addMethods({
    ACT1_INIT: async (request) => {
      const ticket = request.params.tkt
      if (typeof ticket !== 'string') throw new Error('Missing param: tkt')

      const config = _ticketConfigs.get(ticket)
      if (!config) throw new Error(`Ticket "${ticket}" not found`)

      const sfp = await sessionFingerprint(request, ticket)

      return createJWS({ peer: config.peer, sfp }, config.signer)
    },
    ACT1_VERIFY: async (request) => {
      const ticket = request.params.tkt
      const jws = request.params.jws

      if (typeof ticket !== 'string') throw new Error('Missing param: tkt')
      if (typeof jws !== 'string') throw new Error('Missing param: jws')

      const config = _ticketConfigs.get(ticket)
      if (!config) throw new Error(`Ticket "${ticket}" not found`)

      const { peer, sfp } = await verifyJWS(jws, resolver, supportedMethods)

      const sfpValid = await sessionFingerprint(request, ticket)

      if (sfp !== sfpValid) throw new Error('Invalid session fingerprint')

      const final = await config.onVerify?.(peer)

      _ticketConfigs.delete(ticket)

      return {
        status: 'OK',
        feeds: final?.feeds
      }
    }
  })

  // ==========

  return {
    _ticketConfigs,
    /**
     *
     * @param {object} opts
     * @param {RespondAs} opts.respondAs
     * @param {OnVerify} [opts.onVerify]
     * @param {()=>Promise<void> | void} [opts.onTimeout]
     * @param {number} [opts.timeout]
     * @returns
     */
    issueURL: ({ respondAs, onVerify, onTimeout, timeout = 2 * 60 * 1000 }) => {
      const ticket = base58btc.encode(randomBytes(8))

      // TODO support non did:key methods
      const id = didKeyFromPubKey(respondAs.signer.keyPair.publicKey)

      const config = _ticketConfigs.get(ticket) || {
        signer: signers[respondAs.signer.type || 'ES256K'](
          respondAs.signer.keyPair.secretKey
        ),
        // @ts-ignore
        peer: { ...respondAs.metadata, '@id': id },
        onVerify,
        timeout
      }

      setTimeout(async () => {
        _ticketConfigs.delete(ticket)
        await onTimeout?.()
      }, timeout)

      _ticketConfigs.set(ticket, config)

      return 'slash://' + address + '?act=1&tkt=' + ticket
    }
  }
}

/** @typedef {import('./interfaces').SlashtagsRPC} SlashtagsRPC */
/** @typedef {import('did-jwt').Signer} Signer */
/** @typedef {import('./interfaces').OnVerify} OnVerify */
/** @typedef {import('./interfaces').TicketConfig} TicketConfig */
/** @typedef {import('./interfaces').RespondAs} RespondAs */
/** @typedef {import('did-resolver').ResolverRegistry} ResolverRegistry */
