import { createAuth } from '../src/authenticator.js'
import { DEFAULT_CHALLENGE_LENGTH, DEFAULT_CURVE } from '../src/constants.js'
import test from 'ava'
import { sessionID } from '../src/sessions.js'

const keypair = DEFAULT_CURVE.generateKeyPair()

test('should create new encoded challenge message', (t) => {
  const { responder } = createAuth(keypair)

  const challenge = responder.newChallenge(10)

  t.deepEqual(challenge.byteLength, DEFAULT_CHALLENGE_LENGTH)
})

test('should save the newly created challenge in the sessions map', (t) => {
  const { responder } = createAuth(keypair)
  const challenge = responder.newChallenge(10)

  const id = sessionID(challenge)
  const session = responder.sessions.get(id)

  t.deepEqual(session?.metadata, new Uint8Array(0))

  t.deepEqual(session.timer._destroyed, false)
})

test('should save the global metdata in the session', (t) => {
  const { responder } = createAuth(keypair, { metadata: { foo: 'bar' } })
  const challenge = responder.newChallenge(10)

  const id = sessionID(challenge)
  const session = responder.sessions.get(id)

  t.deepEqual(
    session?.metadata,
    new TextEncoder().encode(JSON.stringify({ foo: 'bar' }))
  )
})

test('should save the overriding session metadata in the session', (t) => {
  const { responder } = createAuth(keypair, { metadata: { foo: 'bar' } })
  const challenge = responder.newChallenge(10, { foo: 'zar' })

  const id = sessionID(challenge)
  const session = responder.sessions.get(id)

  t.deepEqual(
    session?.metadata,
    new TextEncoder().encode(JSON.stringify({ foo: 'zar' }))
  )
})

test('should remove the challenge from sessions after timeout', async (t) => {
  const { responder } = createAuth(keypair)
  const challenge = responder.newChallenge(10)

  const id = sessionID(challenge)
  const session = responder.sessions.get(id)

  t.deepEqual(session.timer._destroyed, false)

  await new Promise((resolve) => setTimeout(resolve, 11))

  t.deepEqual(session.timer._destroyed, true)
  t.deepEqual(responder.sessions.get(id), undefined)
})
