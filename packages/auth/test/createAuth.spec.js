import test from 'ava'
import { secp256k1 } from 'noise-curve-secp256k1'
import * as secp from 'noise-handshake/dh.js'
import { createAuth } from '../src/index.js'
import { DEFAULT_CHALLENGE_LENGTH } from '../src/constants.js'

test('should create authenticator with default configurations', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair)

  t.deepEqual(
    JSON.stringify(authenticator.config),
    JSON.stringify({
      metadata: undefined,
      challengeLength: DEFAULT_CHALLENGE_LENGTH,
      curve: authenticator.config.curve
    })
  )

  t.deepEqual(authenticator.config.curve.ALG, secp256k1.ALG)
})

test('should create authenticator with custom configurations', (t) => {
  const keypair = secp.generateKeyPair()
  const authenticator = createAuth(keypair, {
    curve: secp,
    metadata: { foo: 'bar' },
    challengeLength: 42
  })

  t.deepEqual(authenticator.config, {
    metadata: { foo: 'bar' },
    challengeLength: 42,
    curve: secp
  })
})

test('should validate keypair against the handshake curve', (t) => {
  const keypair = secp.generateKeyPair()

  t.throws(() => createAuth(keypair), {
    message: 'Invalid publicKey size for curve: secp256k1',
    instanceOf: Error
  })
})

test('should expose readonly sessions Map for debugging', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair)

  t.deepEqual(authenticator.sessions instanceof Map, true)
})
