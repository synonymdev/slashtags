import test from 'ava'
import { encodePayload, decodePayload } from '../src/messages.js'
import { varint } from '@synonymdev/slashtags-common'

test('should throw an error for unknown version code', async (t) => {
  const payload = encodePayload(new Uint8Array(0), new Uint8Array(0))

  payload.set(varint.prepend([4], new Uint8Array(0)), 0)

  t.throws(() => decodePayload(payload), {
    message: 'Unknown SlashtagsAuth version code',
    instanceOf: Error
  })
})
