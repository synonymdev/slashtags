import test from 'ava'
import originalVarint from 'varint'
import * as varint from '../../../src/functions/varint.js'

test('should prepend one integer as varint to a Uint8Array', (t) => {
  const bytes = new TextEncoder().encode('foobar')
  const int = 42

  const result = varint.prepend(int, bytes)
  t.deepEqual(result, Uint8Array.from([int, ...bytes]))
})

test('should prepend one integer bigger than 128 as varint to a Uint8Array', (t) => {
  const bytes = new TextEncoder().encode('foobar')
  const int = 128

  const result = varint.prepend(int, bytes)
  t.deepEqual(
    result,
    Uint8Array.from([...originalVarint.encode(int), ...bytes])
  )
})

test('should prepend multiple integers as varints to a Uint8Array', (t) => {
  const bytes = new TextEncoder().encode('foobar')
  const int = [42, 128, 110]

  const result = varint.prepend(int, bytes)
  t.deepEqual(result, Uint8Array.from([42, 128, 1, 110, ...bytes]))
})
