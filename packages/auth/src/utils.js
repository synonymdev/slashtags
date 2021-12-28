import { decodeJWT, verifyJWS as _verifyJWS } from 'did-jwt'
import { base58btc } from 'multiformats/bases/base58'
import { varint } from '@synonymdev/slashtags-common'
import * as u8a from 'uint8arrays'
import createHmac from 'create-hmac'
import createHash from 'create-hash'

/**
 *
 * @param {Uint8Array} publicKey
 */
export const didKeyFromPubKey = (publicKey) =>
  'did:key:' + base58btc.encode(varint.prepend([0xe7], publicKey))

/** @type {Uint8Array} */
let NS

/**
 *
 * @param {{noiseSocket: {handshakeHash: Uint8Array}}} request
 * @param {string} ticket
 * @returns
 */
export const sessionFingerprint = (request, ticket = '') => {
  NS = NS || createHash('sha256').update('ACT1').digest()
  const ticketHash = createHash('sha256').update(ticket).digest()

  return u8a.toString(
    createHmac(
      'sha256',
      // @ts-ignore
      request.noiseSocket.handshakeHash
    )
      .update(u8a.concat([NS, ticketHash]))
      .digest(),
    'base64'
  )
}

/**
 *
 * @param {string} jws
 * @param {import('did-resolver').Resolver} resolver
 * @param {string[]} supportedMethod
 */
export const verifyJWS = async (jws, resolver, supportedMethod) => {
  const { payload } = decodeJWT(jws)

  const id = payload.peer?.['@id']

  if (!id) throw new Error('Missing @id in jws')

  const did = await resolver.resolve(id)

  if (did.didResolutionMetadata.error) {
    throw new Error(
      `Unsupported did method: did method should be one of: ${JSON.stringify(
        supportedMethod
      )}, instead got "${id.slice(4).replace(/:.*$/, '')}"`
    )
  }

  _verifyJWS(
    jws,
    // @ts-ignore
    did.didDocument.verificationMethod
  )

  return payload
}

/** @typedef {import('did-jwt').Signer} Signer */
