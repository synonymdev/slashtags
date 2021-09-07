import assert from 'assert'
import secp256k1 from 'noise-curve-secp'
import { createAuth } from '../src/authenticator.js'
import * as varint from '../src/varint.js'
import { decodeAttestation } from '../src/messages.js'
import { AttestationSource } from '../src/constants.js'

describe('Slashtags Auth: verify(): Biderictional verification', () => {
  it('should create new encoded challenge message', () => {
    const keypair = secp256k1.generateKeyPair()
    const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

    const responderKP = secp256k1.generateKeyPair()
    const responder = createAuth(responderKP, {
      metadata: { foo: 'responder' }
    })

    const challengeMsg = responder.newChallenge(10)

    const attestation = initiator.signChallenge(challengeMsg)

    const result = responder.verify(attestation)

    assert.deepEqual(result.as, 'Responder')

    if (result.as === 'Responder') {
      assert.deepEqual(result, {
        as: 'Responder',
        metadata: { foo: 'intitiator' },
        responderAttestation: result.responderAttestation
      })

      const { attestationSource, splitAt } = decodeAttestation(
        result.responderAttestation
      )

      assert.equal(attestationSource, AttestationSource.Responder)
      assert.equal(splitAt, responderKP.publicKey.byteLength)

      const finalResult = initiator.verify(result.responderAttestation)

      assert.deepEqual(finalResult.as, 'Initiator')
      if (finalResult.as === 'Initiator') {
        assert.deepEqual(finalResult, {
          as: 'Initiator',
          metadata: { foo: 'responder' },
          responderPK: finalResult.responderPK
        })
      }
    }
  })

  it('should throw an error for unknown AttestationSource', () => {
    const keypair = secp256k1.generateKeyPair()
    const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

    const responderKP = secp256k1.generateKeyPair()
    const responder = createAuth(responderKP, {
      metadata: { foo: 'responder' }
    })

    const challengeMsg = responder.newChallenge(10)

    const attestation = initiator.signChallenge(challengeMsg)
    attestation.set(varint.prepend([4], new Uint8Array(0)), 1)

    let err
    try {
      responder.verify(attestation)
    } catch (error) {
      err = error
    }

    assert.equal(err.message, 'Invalid Attestation source: 4')
  })

  it('should throw an error for sessions not found', async () => {
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

    let err
    try {
      responder.verify(attestation)
    } catch (error) {
      err = error
    }

    assert.equal(err.message, `Challenge ${sessionKey} not found`)
  })

  it('should throw an error for unknown version code', async () => {
    const keypair = secp256k1.generateKeyPair()
    const initiator = createAuth(keypair, { metadata: { foo: 'intitiator' } })

    const responderKP = secp256k1.generateKeyPair()
    const responder = createAuth(responderKP, {
      metadata: { foo: 'responder' }
    })

    const challengeMsg = responder.newChallenge(10)

    const attestation = initiator.signChallenge(challengeMsg)
    attestation.set(varint.prepend([4], new Uint8Array(0)), 0)

    let err
    try {
      responder.verify(attestation)
    } catch (error) {
      err = error
    }

    assert.equal(err.message, 'Unknown SlashtagsAuth version code')
  })
})
