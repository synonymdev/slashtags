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

/**
 * Collect a stream of data into an array
 *
 * @param {import('stream').Readable} stream
 * @param {(el: any)=>any} [callback] - modify objects before pushing them to the resulting array
 * @returns
 */
export function collect (stream, callback = (d) => d) {
  return new Promise((resolve, reject) => {
    /** @type {Array<any>} */
    const entries = []
    stream?.on('data', /** @param {*} d */ (d) => entries.push(callback(d)))
    stream?.on('end', () => resolve(entries))
    stream?.on('error', /** @param {*} err */ (err) => reject(err))
    stream?.on('close', () => reject(new Error('Premature close')))
  })
}
