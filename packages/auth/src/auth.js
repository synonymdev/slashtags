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

      config.sfp = sfp

      const { responder, additionalItems } = await config.onInit()

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
      const peer = request.params.profile

      if (!peer?.['@id']) throw new Error('Missing param: profile["@id"]')

      const config = _ticketConfigs.get(ticket)
      if (!config) throw new Error(`Ticket "${ticket}" not found`)

      const { sfp } = await verify(jws, peer['@id'])

      if (sfp !== config.sfp) throw new Error('Invalid session fingerprint')

      const final = await config.onVerify?.(
        peer,
        // @ts-ignore
        request.params.metadata
      )

      _ticketConfigs.delete(ticket)

      return { status: 'OK', metadata: final?.additionalItems }
    }
  })

  // ==========

  return {
    _ticketConfigs,
    /**
     *
     * @param {object} opts
     * @param {OnInit} opts.onInit
     * @param {OnVerify} [opts.onVerify]
     * @param {()=>Promise<void> | void} [opts.onTimeout]
     * @param {number} [opts.timeout]
     * @returns
     */
    issueURL: ({ onInit, onVerify, onTimeout, timeout = 2 * 60 * 1000 }) => {
      const ticket = base58btc.encode(randomBytes(8))

      const config = _ticketConfigs.get(ticket) || {
        onInit,
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
/** @typedef {import('./interfaces').OnInit} OnInit */
/** @typedef {import('./interfaces').Profile} Profile */
/** @typedef {import('@synonymdev/slashtags-common').JsonLdObject} JsonLdObject */
/** @typedef {import('did-resolver').ResolverRegistry} ResolverRegistry */
