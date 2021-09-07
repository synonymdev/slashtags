import assert from 'assert'
import * as secp256k1 from 'noise-curve-secp'
import * as secp from 'noise-handshake/dh.js'
import { createAuth } from '../src/index.js'
import { DEFAULT_CHALLENGE_LENGTH } from '../src/constants.js'

describe('Slashtags Auth: createAuth()', () => {
  it('should create authenticator with default configurations', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair)

    assert.deepEqual(
      JSON.stringify(authenticator.config),
      JSON.stringify({
        metadata: undefined,
        challengeLength: DEFAULT_CHALLENGE_LENGTH,
        curve: secp256k1
      })
    )
  })

  it('should create authenticator with custom configurations', () => {
    const keypair = secp.generateKeyPair()
    const authenticator = createAuth(keypair, {
      curve: secp,
      metadata: { foo: 'bar' },
      challengeLength: 42
    })

    assert.deepEqual(authenticator.config, {
      metadata: { foo: 'bar' },
      challengeLength: 42,
      curve: secp
    })
  })

  it('should validate keypair against the handshake curve', () => {
    const keypair = secp.generateKeyPair()
    let err
    try {
      createAuth(keypair)
    } catch (error) {
      err = error
    }
    assert.equal(err.message, 'Invalid publicKey size for curve: secp256k1')
  })

  it('should expose readonly sessions Map for debugging', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair)

    assert.equal(authenticator.sessions instanceof Map, true)
  })
})
