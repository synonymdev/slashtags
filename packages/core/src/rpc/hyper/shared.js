import SDK from 'hyper-sdk'
import { hexString } from '../../utils.js'
import crypto from 'crypto'

export const EXTENSION = 'slashtags'

/**
 * Get a Hypercore instance
 * @param {object} opts
 * @param {keyOrName} [opts.key]
 * @param {KeyPair} opts.keyPair
 * @param {boolean} opts.server
 * @param {boolean} opts.client
 * @returns {Promise<Hypercore>}
 */
export const getFeed = async ({ key, keyPair, server, client }) => {
  const ed25519Secret = crypto
    .createHash('sha256')
    .update(keyPair.secretKey)
    .digest()

  /** @type {SDKInstance} */
  const sdk = await SDK({
    persist: false,
    corestoreOpts: { masterKey: ed25519Secret }
  })

  // If key is passed, connect to that key, otherwise connect to own feed.
  const keyString = key ? hexString(key) : hexString(sdk.keyPair.publicKey)

  // Hypercore key will different from the keyPair.publicKey (secp256k1)
  const feed = sdk.Hypercore(keyString, {
    announce: server,
    lookup: client
  })

  return feed
}

/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').keyOrName} keyOrName */
/** @typedef {import ('../../interfaces').Hypercore} Hypercore */
/** @typedef {import('../../interfaces').SDKInstance} SDKInstance */
