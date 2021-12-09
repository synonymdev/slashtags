import { decodeJWT, verifyJWS as _verifyJWS } from 'did-jwt'
import { Resolver } from 'did-resolver'
import keyresolver from 'key-did-resolver'
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

const SUPPORTED_DID_METHODS = ['key']

/**
 *
 * @param {string} jws
 */
export const verifyJWS = async (jws) => {
  const { payload } = decodeJWT(jws)

  /** @type {string} */
  const did = payload.peer?.['@id']

  const method = did.slice(4).replace(/:.*$/, '')

  if (!SUPPORTED_DID_METHODS.includes(method)) {
    throw new Error(
      `Unsupported did method: did method should be one of: ${JSON.stringify(
        SUPPORTED_DID_METHODS
      )}, instead got "${method}"`
    )
  }

  const { didDocument } = await new Resolver(keyresolver.getResolver()).resolve(
    did
  )

  _verifyJWS(
    jws,
    // @ts-ignore
    didDocument.verificationMethod
  )

  return payload
}

/** @typedef {import('did-jwt').Signer} Signer */
