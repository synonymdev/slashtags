import test from 'ava'
import secp from 'noise-handshake/dh.js'
import { secp256k1 } from 'noise-curve-tiny-secp'
import { createHandshake, generateChallenge } from '../src/crypto.js'
import { createAuth } from '../src/authenticator.js'
import { encodeChallenge, decodeAttestation } from '../src/messages.js'
import { AttestationSource, PROLOGUE } from '../src/constants.js'

test('should throw an error if the remotePK length does not match the handshake curve', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair)

  const remotePK = secp.generateKeyPair().publicKey
  const challenge = generateChallenge()

  const msg = encodeChallenge(challenge, remotePK)

  t.throws(() => authenticator.signChallenge(msg), {
    message: 'Invalid publicKey size for curve: secp256k1',
    instanceOf: Error
  })
})

test('should not throw an error for valid remote public key', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair)

  const remotePK = secp256k1.generateKeyPair().publicKey
  const challenge = generateChallenge()

  const msg = encodeChallenge(challenge, remotePK)

  t.notThrows(() => authenticator.signChallenge(msg))
})

test('should correctly signt the challenge and return an encoded attestation', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair)

  const remoteKeypair = secp256k1.generateKeyPair()
  const challenge = generateChallenge()

  const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

  const attestation = authenticator.signChallenge(msg)

  const { attestationSource, splitAt, signedMessage } =
    decodeAttestation(attestation)

  t.deepEqual(attestationSource, AttestationSource.Initiator)

  const handshake = createHandshake('IK', false, remoteKeypair, {
    curve: secp256k1
  })

  handshake.initialise(PROLOGUE)
  const res = handshake.recv(signedMessage)

  const metadata = res.slice(splitAt)
  t.deepEqual(res.slice(0, splitAt), challenge)
  t.deepEqual(new TextDecoder().decode(metadata), '')
})

test('should correctly sign the challenge and return an encoded attestation with metdata', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } })

  const remoteKeypair = secp256k1.generateKeyPair()
  const challenge = generateChallenge()

  const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

  const attestation = authenticator.signChallenge(msg)

  const { attestationSource, splitAt, signedMessage } =
    decodeAttestation(attestation)

  t.deepEqual(attestationSource, AttestationSource.Initiator)

  const handshake = createHandshake('IK', false, remoteKeypair, {
    curve: secp256k1
  })

  handshake.initialise(PROLOGUE)
  const res = handshake.recv(signedMessage)

  const metadata = res.slice(splitAt)
  t.deepEqual(res.slice(0, splitAt), challenge)
  t.deepEqual(
    new TextDecoder().decode(metadata),
    JSON.stringify({ foo: 'bar' })
  )
})

test('should override global metadata for one time attestation', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } })

  const remoteKeypair = secp256k1.generateKeyPair()
  const challenge = generateChallenge()

  const msg = encodeChallenge(challenge, remoteKeypair.publicKey)

  const attestation = authenticator.signChallenge(msg, { foo: 'zar' })

  const { attestationSource, splitAt, signedMessage } =
    decodeAttestation(attestation)

  t.deepEqual(attestationSource, AttestationSource.Initiator)

  const handshake = createHandshake('IK', false, remoteKeypair, {
    curve: secp256k1
  })

  handshake.initialise(PROLOGUE)
  const res = handshake.recv(signedMessage)

  const metadata = res.slice(splitAt)
  t.deepEqual(res.slice(0, splitAt), challenge)
  t.deepEqual(
    new TextDecoder().decode(metadata),
    JSON.stringify({ foo: 'zar' })
  )
})
