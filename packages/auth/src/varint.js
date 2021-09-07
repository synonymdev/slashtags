import varint from 'varint'

/**
 * Prepend one or more varints to a Uint8Array
 * @param {number|number[]} integers
 * @param {Uint8Array} bytes
 */
export const prepend = (integers, bytes) => {
  if (!Array.isArray(integers)) integers = [integers]
  const varints = integers.flatMap((int) => varint.encode(int))

  return Uint8Array.from([...varints, ...bytes])
}

/**
 * Returns a tuple of the first varint, the rest and the length of varint
 * @param {Uint8Array} bytes
 * @returns {[number, Uint8Array, number]}
 */
export const split = (bytes) => {
  const int = varint.decode(bytes)

  return [int, bytes.slice(varint.decode.bytes), varint.decode.bytes]
}
