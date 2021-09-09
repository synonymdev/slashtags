import * as DocID from '../src/index.js'
import { base32 } from 'multiformats/bases/base32'
import test from 'ava'

test('should create DocID from a valid string', (t) => {
  const docID = DocID.CID.fromJSON({ hello: 'world' })

  t.deepEqual(DocID.parse(DocID.toString(docID)), {
    type: {
      code: 0,
      mutability: 'Static',
      name: 'CID'
    },
    bytes: docID.bytes,
    index: Uint8Array.from([
      1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203, 240, 168,
      210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212, 124, 96,
      243, 203, 104, 21, 136
    ])
  })
})

test('should create DocID from a valid bytes', (t) => {
  const bytes = DocID.create(1, Uint8Array.from([0])).bytes

  t.deepEqual(DocID.parse(base32.encode(bytes)), {
    type: {
      code: 1,
      mutability: 'Stream',
      name: 'FeedID'
    },
    bytes,
    index: Uint8Array.from([0])
  })
})

test('should throw an error if t is invalid DocID', (t) => {
  const bytes = base32.encode(
    Uint8Array.from([
      420, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
      240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212,
      124, 96, 243, 203, 104, 21, 136
    ])
  )

  t.throws(() => DocID.parse(bytes), {
    instanceOf: Error,
    message: 'Invalid Slashtags DocID'
  })
})
