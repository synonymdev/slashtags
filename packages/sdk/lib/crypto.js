import sodium from 'sodium-universal'
import b4a from 'b4a'

const NS = hash('slashtags')

/**
 * Generates a seed from the slashtags Namespace, name and primaryKey.
 *
 * @param {Uint8Array} pk
 * @param {string} [name]
 * @returns
 */
export function generateSeed (pk, name = '') {
  const seed = b4a.allocUnsafe(32)
  sodium.crypto_generichash_batch(seed, [NS, b4a.from(name)], pk)
  return seed
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
