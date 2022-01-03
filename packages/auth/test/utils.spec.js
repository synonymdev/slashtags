import test from 'ava'
import {
  didKeyFromPubKey,
  sessionFingerprint,
  verifyFactory
} from '../src/utils.js'
import { secp256k1 as curve } from 'noise-curve-tiny-secp'
import * as u8a from 'uint8arrays'
import { createJWS } from 'did-jwt'
import { signers } from '../src/signers.js'

const verify = verifyFactory()

test('Create sessionFingerPrint', async (t) => {
  t.deepEqual(
    sessionFingerprint({
      noiseSocket: { handshakeHash: u8a.fromString('test') }
    }),
    'C96gBF1lhlZAU+OAcALRLs1M6R12cDzPeKh2MGeYoCg'
  )
})

test('Create a did with key method from a publickey', (t) => {
  t.deepEqual(
    didKeyFromPubKey(curve.generateSeedKeyPair('test').publicKey),
    'did:key:zQ3shTqc6KFPmJLMdD8qPUFnMj1ainrAzKx42cMaB4nrSF4FK'
  )
})

test('verifyJWS: valid jws', async (t) => {
  const keypair = curve.generateSeedKeyPair('test')
  const id = didKeyFromPubKey(keypair.publicKey)

  t.deepEqual(
    await verify(
      await createJWS({ sfp: 'secretsfp' }, signers.ES256K(keypair.secretKey)),
      id
    ),
    { sfp: 'secretsfp' }
  )
})

test('verifyJWS: invalid jws', async (t) => {
  const keypair = curve.generateSeedKeyPair('test')

  const wrongID = didKeyFromPubKey(
    curve.generateSeedKeyPair('wrong').publicKey
  )

  await t.throwsAsync(
    async () =>
      await verify(
        await createJWS(
          { sfp: 'secretsfp' },
          signers.ES256K(keypair.secretKey)
        ),
        wrongID
      ),
    {
      message: 'invalid_signature: Signature invalid for JWT'
    }
  )
})

test('VerifyJWS: should throw an error for unavailable did methods', async (t) => {
  const keypair = curve.generateSeedKeyPair('test')
  const id = 'did:notkey:foobar'

  await t.throwsAsync(
    async () =>
      verify(
        await createJWS(
          { sfp: 'secretsfp' },
          signers.ES256K(keypair.secretKey)
        ),
        id
      ),
    {
      message:
        'Unsupported did method: did method should be one of: ["key"], instead got "notkey"'
    }
  )
})
