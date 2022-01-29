import varint from 'varint'

/**
 * Prepend one or more varints to a Uint8Array
 *
 * @param {number|number[]} integers
 * @param {Uint8Array} bytes
 */
export const prepend = (integers, bytes) => {
  if (!Array.isArray(integers)) integers = [integers]

  const totalOffset = integers.reduce(
    (acc, int) => acc + varint.encodingLength(int),
    0
  )

  const out = new Uint8Array(totalOffset + bytes.byteLength)

  let offset = 0

  integers.forEach((int) => {
    out.set(varint.encode(int), offset)
    offset += varint.encode.bytes
  })

  out.set(bytes, totalOffset)

  return out
}

/**
 * Returns a tuple of the first varint, the rest and the length of varint
 *
 * @param {Uint8Array} bytes
 * @returns {[number, Uint8Array, number]}
 */
export const split = (bytes) => {
  const int = varint.decode(bytes)

  return [int, bytes.slice(varint.decode.bytes), varint.decode.bytes]
}
