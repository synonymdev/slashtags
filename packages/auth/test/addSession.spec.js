import { addSession, hex } from '../src/sessions.js'
import { generateChallenge } from '../src/crypto.js'
import test from 'ava'

test('should create a new session and add it to the passed sessions map', (t) => {
  const sessions = new Map()
  const challenge = generateChallenge()
  addSession({ sessions, timeout: 10, challenge: challenge })

  const session = sessions.get(hex(challenge))

  t.deepEqual(session, {
    challenge: challenge,
    timer: session.timer,
    metadata: new Uint8Array(0)
  })
  t.deepEqual(session.timer._destroyed, false)
})

test('should be automatically removed from the passed sessions after timeout', async (t) => {
  const sessions = new Map()
  const challenge = generateChallenge()
  addSession({ sessions, timeout: 10, challenge: challenge })

  const session = sessions.get(hex(challenge))

  t.deepEqual(session.timer._destroyed, false)

  await new Promise((resolve) => setTimeout(resolve, 11))

  t.deepEqual(session.timer._destroyed, true)
  t.deepEqual(sessions.get(challenge.toString('hex')), undefined)
})
