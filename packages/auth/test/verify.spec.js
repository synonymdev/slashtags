import test from 'ava'
import { secp256k1 } from 'noise-curve-tiny-secp'
import { createAuth } from '../src/authenticator.js'
import { varint } from '@synonymdev/slashtags-common'
import { decodeAttestation } from '../src/messages.js'
import { AttestationSource } from '../src/constants.js'

test('should create new encoded challenge message', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

  const responderKP = secp256k1.generateKeyPair()
  const responder = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challengeMsg = responder.newChallenge(10)

  const attestation = initiator.signChallenge(challengeMsg)

  const result = responder.verify(attestation)

  t.deepEqual(result.as, 'Responder')

  if (result.as === 'Responder') {
    t.deepEqual(result, {
      as: 'Responder',
      metadata: { foo: 'intitiator' },
      initiatorPK: Uint8Array.from(keypair.publicKey),
      responderAttestation: result.responderAttestation
    })

    const { attestationSource, splitAt } = decodeAttestation(
      result.responderAttestation
    )

    t.deepEqual(attestationSource, AttestationSource.Responder)
    t.deepEqual(splitAt, responderKP.publicKey.byteLength)

    const finalResult = initiator.verify(result.responderAttestation)

    t.deepEqual(finalResult.as, 'Initiator')
    if (finalResult.as === 'Initiator') {
      t.deepEqual(finalResult, {
        as: 'Initiator',
        metadata: { foo: 'responder' },
        responderPK: finalResult.responderPK
      })
    }
  }
})

test('should throw an error for unknown AttestationSource', (t) => {
  const keypair = secp256k1.generateKeyPair()
  const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

  const responderKP = secp256k1.generateKeyPair()
  const responder = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challengeMsg = responder.newChallenge(10)

  const attestation = initiator.signChallenge(challengeMsg)
  attestation.set(varint.prepend([4], new Uint8Array(0)), 1)

  t.throws(() => responder.verify(attestation), {
    message: 'Invalid Attestation source: 4',
    instanceOf: Error
  })
})

test('should throw an error for sessions not found', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

  const responderKP = secp256k1.generateKeyPair()
  const responder = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challengeMsg = responder.newChallenge(10)

  const attestation = initiator.signChallenge(challengeMsg)

  const sessionKey = Array.from(responder.sessions.keys())[0]

  await new Promise((resolve) => setTimeout(resolve, 11))

  t.throws(() => responder.verify(attestation), {
    message: `Challenge ${sessionKey} not found`,
    instanceOf: Error
  })
})

test('should throw an error for unknown version code', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

  const responderKP = secp256k1.generateKeyPair()
  const responder = createAuth(responderKP, {
    metadata: { foo: 'responder' }
  })

  const challengeMsg = responder.newChallenge(10)

  const attestation = initiator.signChallenge(challengeMsg)
  attestation.set(varint.prepend([4], new Uint8Array(0)), 0)

  t.throws(() => responder.verify(attestation), {
    message: 'Unknown SlashtagsAuth version code',
    instanceOf: Error
  })
})

test('should handle custom challengeLength', async (t) => {
  const keypair = secp256k1.generateKeyPair()
  const initiator = createAuth(keypair, {
    metadata: { foo: 'intitiator' },
    challengeLength: 16
  })

  const responderKP = secp256k1.generateKeyPair()
  const responder = createAuth(responderKP, {
    metadata: { foo: 'responder' },
    challengeLength: 128
  })

  const challengeMsg = responder.newChallenge(10)

  const attestation = initiator.signChallenge(challengeMsg)

  const result = responder.verify(attestation)

  t.deepEqual(result.as, 'Responder')

  if (result.as === 'Responder') {
    t.deepEqual(result, {
      as: 'Responder',
      initiatorPK: Uint8Array.from(keypair.publicKey),
      metadata: { foo: 'intitiator' },
      responderAttestation: result.responderAttestation
    })

    const { attestationSource, splitAt } = decodeAttestation(
      result.responderAttestation
    )

    t.deepEqual(attestationSource, AttestationSource.Responder)
    t.deepEqual(splitAt, responderKP.publicKey.byteLength)

    const finalResult = initiator.verify(result.responderAttestation)

    t.deepEqual(finalResult.as, 'Initiator')
    if (finalResult.as === 'Initiator') {
      t.deepEqual(finalResult, {
        as: 'Initiator',
        metadata: { foo: 'responder' },
        responderPK: finalResult.responderPK
      })
    }
  }
})
