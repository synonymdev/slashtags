import test from 'ava'
import * as varint from '../../../src/functions/varint.js'

test('should return a tuple of the first varint and the rest', (t) => {
  const bytes = new TextEncoder().encode('foobar')
  const int = [42, 128, 110]

  const result = varint.prepend(int, bytes)

  t.deepEqual(varint.split(result), [
    42,
    Uint8Array.from([128, 1, 110, ...bytes]),
    1
  ])
})
