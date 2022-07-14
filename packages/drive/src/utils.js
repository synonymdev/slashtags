import sodium from 'sodium-universal'
import b4a from 'b4a'

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
