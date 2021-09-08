import { DocID } from '../src/index.js'
import test from 'ava'

test('should convert it to a string with default base32', (t) => {
  const bytes = Uint8Array.from([
    210, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
    240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212,
    124, 96, 243, 203, 104, 21, 136
  ])

  const docID = DocID.create('CID', bytes)

  t.deepEqual(
    DocID.toString(docID),
    'b2iaqbuqbaaayabasecj2eolrvekol2wl6cuneukuzwrqtq6by4x3xgiu2r6gb46lnakyq'
  )
})
