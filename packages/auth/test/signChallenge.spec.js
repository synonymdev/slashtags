import assert from 'assert'
import secp from 'noise-handshake/dh.js'
import secp256k1 from 'noise-curve-secp'
import { createHandshake, generateChallenge } from '../src/crypto.js'
import { createAuth } from '../src/authenticator.js'
import { encodeChallenge, decodeAttestation } from '../src/messages.js'
import { AttestationSource, PROLOGUE } from '../src/constants.js'

describe('Slashtags Auth: signChallenge()', () => {
  it('should throw an error if the remotePK length does not match the handshake curve', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair)

    const remotePK = secp.generateKeyPair().publicKey
    const challenge = generateChallenge()

    const msg = encodeChallenge(challenge, remotePK)

    let error
    try {
      authenticator.signChallenge(msg)
    } catch (err) {
      error = err
    }

    assert.equal(error.message, 'Invalid publicKey size for curve: secp256k1')
  })

  it('should not throw an error for valid remote public key', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair)

    const remotePK = secp256k1.generateKeyPair().publicKey
    const challenge = generateChallenge()

    const msg = encodeChallenge(challenge, remotePK)

    let error
    try {
      authenticator.signChallenge(msg)
    } catch (err) {
      error = err
    }

    assert.equal(error, undefined)
  })

  it('should correctly signt the challenge and return an encoded attestation', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair)

    const remoteKeypair = secp256k1.generateKeyPair()
    const challenge = generateChallenge()

    const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

    const attestation = authenticator.signChallenge(msg)

    const { attestationSource, challengeLength, signedMessage } =
      decodeAttestation(attestation)

    assert.equal(attestationSource, AttestationSource.Initiator)

    const handshake = createHandshake('IK', false, remoteKeypair, {
      curve: secp256k1
    })

    handshake.initialise(PROLOGUE)
    const res = handshake.recv(signedMessage)

    const metadata = res.slice(challengeLength)
    assert.deepEqual(res.slice(0, challengeLength), challenge)
    assert.equal(metadata, undefined)
  })

  it('should correctly signt the challenge and return an encoded attestation with metdata', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } })

    const remoteKeypair = secp256k1.generateKeyPair()
    const challenge = generateChallenge()

    const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

    const attestation = authenticator.signChallenge(msg)

    const { attestationSource, challengeLength, signedMessage } =
      decodeAttestation(attestation)

    assert.equal(attestationSource, AttestationSource.Initiator)

    const handshake = createHandshake('IK', false, remoteKeypair, {
      curve: secp256k1
    })

    handshake.initialise(PROLOGUE)
    const res = handshake.recv(signedMessage)

    const metadata = res.slice(challengeLength)
    assert.deepEqual(res.slice(0, challengeLength), challenge)
    assert.equal(
      new TextDecoder().decode(metadata),
      JSON.stringify({ foo: 'bar' })
    )
  })

  it('should override global metadata for one time attestation', () => {
    const keypair = secp256k1.generateKeyPair()
    const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } })

    const remoteKeypair = secp256k1.generateKeyPair()
    const challenge = generateChallenge()

    const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

    const attestation = authenticator.signChallenge(msg, { foo: 'zar' })

    const { attestationSource, challengeLength, signedMessage } =
      decodeAttestation(attestation)

    assert.equal(attestationSource, AttestationSource.Initiator)

    const handshake = createHandshake('IK', false, remoteKeypair, {
      curve: secp256k1
    })

    handshake.initialise(PROLOGUE)
    const res = handshake.recv(signedMessage)

    const metadata = res.slice(challengeLength)
    assert.deepEqual(res.slice(0, challengeLength), challenge)
    assert.equal(
      new TextDecoder().decode(metadata),
      JSON.stringify({ foo: 'zar' })
    )
  })
})
