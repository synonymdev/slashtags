import sodium from 'sodium-universal'
import b4a from 'b4a'

const NS = hash('slashtags')

/**
 * Generates a seed from the slashtags Namespace, name and primaryKey.
 *
 * @param {Uint8Array} pk
 * @param {string} name
 * @returns
 */
function generateSeed (pk, name) {
  const seed = b4a.allocUnsafe(32)
  sodium.crypto_generichash_batch(seed, [NS, Buffer.from(name)], pk)
  return seed
}

/**
 * Generates a Slashtag keypair from a primary key and a name.
 *
 * @param {Uint8Array} primaryKey
 * @param {string} name
 */
export function createKeyPair (primaryKey, name) {
  /** @type {KeyPair} */
  const keyPair = {
    publicKey: b4a.allocUnsafe(sodium.crypto_sign_PUBLICKEYBYTES),
    secretKey: b4a.allocUnsafe(sodium.crypto_sign_SECRETKEYBYTES),
    auth: {
      sign: (message) => {
        const signature = b4a.allocUnsafe(sodium.crypto_sign_BYTES)
        sodium.crypto_sign_detached(signature, message, keyPair.secretKey)
        return signature
      },
      verify: (message, signature) =>
        sodium.crypto_sign_verify_detached(
          signature,
          message,
          keyPair.publicKey
        )
    }
  }

  const seed = generateSeed(primaryKey, name)
  sodium.crypto_sign_seed_keypair(keyPair.publicKey, keyPair.secretKey, seed)

  return keyPair
}

/**
 * Generates a random Uint8Array of the given length.
 *
 * @param {number} [count=32]
 * @returns
 */
export function randomBytes (count = 32) {
  const buf = b4a.allocUnsafe(count)
  sodium.randombytes_buf(buf)
  return buf
}

/**
 * Generates an blake2b hash of a buffer or string.
 *
 * @param {Uint8Array | string} input
 */
export function hash (input) {
  if (!b4a.isBuffer(input)) input = b4a.from(input)
  const output = b4a.allocUnsafe(32)
  sodium.crypto_generichash(output, input)
  return output
}

/**
 * @typedef {import('./interfaces').KeyPair} KeyPair
 */
