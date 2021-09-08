import { DocID } from '../src/index.js'
import { base32 } from 'multiformats/bases/base32'
import * as multiformats from 'multiformats'
import { wildDecode } from '../src/util.js'
import test from 'ava'

test('should decode baes32 encoded string', (t) => {
  const cid = DocID.CID.fromJSON({ foo: 'bar' })
  const str = base32.encode(cid.bytes)

  t.deepEqual(wildDecode(str), cid.bytes)
})

test('should decode baes32 encoded Uint8Array', (t) => {
  const cid = DocID.CID.fromJSON({ foo: 'bar' })
  const bytes = multiformats.bytes.fromString(base32.encode(cid.bytes))

  t.deepEqual(wildDecode(bytes), cid.bytes)
})

test('should throw an error for unsupported encoding', (t) => {
  const cid = DocID.CID.fromJSON({ foo: 'bar' })
  const str = '^' + cid.toString()

  t.throws(() => wildDecode(str), {
    instanceOf: Error,
    message: 'Unsupported encoding: ^'
  })
})
