import test from 'ava'
import { secp256k1 } from 'noise-curve-tiny-secp'
import { createAuth } from '../src/authenticator.js'
import { varint } from '@synonymdev/slashtags-common'
import { decodeAttestation } from '../src/messages.js'

test('should create new encoded challenge message', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(keypair, {
    metadata: { foo: 'intitiator' }
  })

  const responderKP = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challenge = responder.newChallenge(10)

  const { attestation, verifyResponder } = initiator.signChallenge(
    responderKP.publicKey,
    challenge
  )

  const result = responder.verifyInitiator(attestation)

  t.deepEqual(result, {
    metadata: { foo: 'intitiator' },
    initiatorPK: Uint8Array.from(keypair.publicKey),
    responderAttestation: result.responderAttestation
  })
  const { metadataOffset } = decodeAttestation(result.responderAttestation)

  t.deepEqual(metadataOffset, responderKP.publicKey.byteLength)

  const finalResult = verifyResponder(result.responderAttestation)

  t.deepEqual(finalResult, {
    metadata: { foo: 'responder' },
    responderPK: finalResult.responderPK
  })
})

test('should throw an error for sessions not found', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(keypair, {
    metadata: { foo: 'intitiator' }
  })

  const responderKP = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challenge = responder.newChallenge(10)

  const { attestation } = initiator.signChallenge(
    responderKP.publicKey,
    challenge
  )

  const sessionKey = Array.from(responder.sessions.keys())[0]

  await new Promise((resolve) => setTimeout(resolve, 11))

  t.throws(() => responder.verifyInitiator(attestation), {
    message: `Challenge ${sessionKey} not found`,
    instanceOf: Error
  })
})

test('should throw an error for unknown version code', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(keypair, {
    metadata: { foo: 'intitiator' }
  })

  const responderPK = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderPK, {
    metadata: { foo: 'responder' }
  })

  const challenge = responder.newChallenge(10)

  const { attestation } = initiator.signChallenge(
    responderPK.publicKey,
    challenge
  )
  attestation.set(varint.prepend([4], new Uint8Array(0)), 0)

  t.throws(() => responder.verifyInitiator(attestation), {
    message: 'Unknown SlashtagsAuth version code',
    instanceOf: Error
  })
})

test('should handle custom challengeLength', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(keypair, {
    metadata: { foo: 'intitiator' },
    challengeLength: 16
  })

  const responderPK = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderPK, {
    metadata: { foo: 'responder' },
    challengeLength: 128
  })

  const challenge = responder.newChallenge(10)

  const { attestation, verifyResponder } = initiator.signChallenge(
    responderPK.publicKey,
    challenge
  )

  const result = responder.verifyInitiator(attestation)

  t.deepEqual(result, {
    initiatorPK: Uint8Array.from(keypair.publicKey),
    metadata: { foo: 'intitiator' },
    responderAttestation: result.responderAttestation
  })

  const { metadataOffset } = decodeAttestation(result.responderAttestation)

  t.deepEqual(metadataOffset, responderPK.publicKey.byteLength)

  const finalResult = verifyResponder(result.responderAttestation)

  t.deepEqual(finalResult, {
    metadata: { foo: 'responder' },
    responderPK: finalResult.responderPK
  })
})

test('should throw an error for invalid initiator attestation', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const invalidKeypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(
    {
      ...keypair,
      secretKey: invalidKeypair.secretKey
    },
    {
      metadata: { foo: 'intitiator' }
    }
  )

  const responderPK = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderPK, {
    metadata: { foo: 'responder' }
  })

  const challenge = responder.newChallenge(10)

  const { attestation } = initiator.signChallenge(
    responderPK.publicKey,
    challenge
  )

  t.throws(() => responder.verifyInitiator(attestation), {
    instanceOf: Error,
    message: 'could not verify data'
  })
})

test('should throw an error for invalid responder attestation', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const { initiator } = createAuth(keypair, {
    metadata: { foo: 'intitiator' }
  })

  const responderPK = secp256k1.generateKeyPair()
  const { responder } = createAuth(responderPK, {
    metadata: { foo: 'responder' }
  })

  const challenge = responder.newChallenge(100)

  const { attestation, verifyResponder } = initiator.signChallenge(
    responderPK.publicKey,
    challenge
  )

  const { responderAttestation } = responder.verifyInitiator(attestation)

  verifyResponder(responderAttestation)

  // =====

  const invalidResponderPK = secp256k1.generateKeyPair()
  const { responder: invalidResponder } = createAuth(invalidResponderPK, {
    metadata: { foo: 'responder' }
  })

  const wrongChallenge = invalidResponder.newChallenge(100)
  const { attestation: wrongAttestation } = initiator.signChallenge(
    invalidResponderPK.publicKey,
    wrongChallenge
  )

  const { responderAttestation: invlidResponderAttestation } =
    invalidResponder.verifyInitiator(wrongAttestation)

  t.throws(() => verifyResponder(invlidResponderAttestation), {
    instanceOf: Error,
    message:
      'this.handshake.shift is not a function or its return value is not iterable'
  })
})
