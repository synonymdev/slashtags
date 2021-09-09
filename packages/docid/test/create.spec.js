import * as DocID from '../src/index.js'
import test from 'ava'

test('should create document ID with type code', (t) => {
  const key = Uint8Array.from([
    1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203, 240, 168, 210,
    81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212, 124, 96, 243,
    203, 104, 21, 136
  ])

  t.deepEqual(DocID.create(0, key), {
    type: {
      code: 0,
      mutability: 'Static',
      name: 'CID'
    },
    key,
    bytes: Uint8Array.from([
      210, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
      240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212,
      124, 96, 243, 203, 104, 21, 136
    ])
  })
})

test('should create document ID with type name', (t) => {
  const key = Uint8Array.from([
    1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203, 240, 168, 210,
    81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212, 124, 96, 243,
    203, 104, 21, 136
  ])

  t.deepEqual(DocID.create('CID', key), {
    type: {
      code: 0,
      mutability: 'Static',
      name: 'CID'
    },
    key,
    bytes: Uint8Array.from([
      210, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
      240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212,
      124, 96, 243, 203, 104, 21, 136
    ])
  })
})
