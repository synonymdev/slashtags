import test from 'ava'
import {
  didKeyFromPubKey,
  sessionFingerprint,
  verifyJWS
} from '../src/utils.js'
import { secp256k1 as curve } from 'noise-curve-tiny-secp'
import * as u8a from 'uint8arrays'
import { createJWS } from 'did-jwt'
import { signers } from '../src/index.js'
import { Resolver } from 'did-resolver'
import keyresolver from 'key-did-resolver'

const registry = { ...keyresolver.getResolver() }
const supportedMethods = Object.keys(registry)
const resolver = new Resolver(registry)

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
  t.deepEqual(
    await verifyJWS(
      'eyJhbGciOiJFUzI1NksifQ.eyJwZWVyIjp7IkBpZCI6ImRpZDprZXk6elEzc2h3alNad2NaVTFKbmtuYjNnb2Uzc1FDMVo3Rjl0QWJRU3F3WDk0aWRRRmkxVSIsIkBjb250ZXh0IjoiaHR0cHM6Ly93d3cuc2NoZW1hLm9yZy8iLCJAdHlwZSI6IlBlcnNvbiIsIm5hbWUiOiJFcmljayBSeWFuIiwiaW1hZ2UiOiJodHRwczovL2Nkbi5mYWtlcmNsb3VkLmNvbS9hdmF0YXJzL21hc3Rlcm1pbmRlc2lnbl8xMjguanBnIiwidXJsIjoiaHR0cHM6Ly9qYXZpZXIub3JnIn0sInNmcCI6ImJaTFZkb28zVVI1VlVhaC92emtDWEF6UzkzZzJCU3kvcUFuYStnOGcwMncifQ.uwbN3gwJSOzBToD8EPJNwaZHhKVUFgrW1IbMF06bSr-Y05f3o0FbuVP-ojJuzV8BzG_2ppyZwwtJMAVJzwNlNQ',
      resolver,
      supportedMethods
    ),
    {
      peer: {
        '@id': 'did:key:zQ3shwjSZwcZU1Jnknb3goe3sQC1Z7F9tAbQSqwX94idQFi1U',
        '@context': 'https://www.schema.org/',
        '@type': 'Person',
        name: 'Erick Ryan',
        image: 'https://cdn.fakercloud.com/avatars/mastermindesign_128.jpg',
        url: 'https://javier.org'
      },
      sfp: 'bZLVdoo3UR5VUah/vzkCXAzS93g2BSy/qAna+g8g02w'
    }
  )
})

test('verifyJWS: invalid jws', async (t) => {
  await t.throwsAsync(
    verifyJWS(
      'eyJhbGciOiJFUzI1NksifQ.eyJwZWVyIjp7IkBpZCI6ImRpZDprZXk6elEzc2h3alNad2NaVTFKbmtuYjNnb2Uzc1FDMVo3Rjl0QWJRU3F3WDk0aWRRRmkxVSIsIkBjb250ZXh0IjoiaHR0cHM6Ly93d3cuc2NoZW1hLm9yZy8iLCJAdHlwZSI6IlBlcnNvbiIsIm5hbWUiOiJFcmljayBSeWFuIiwiaW1hZ2UiOiJodHRwczovL2Nkbi5mYWtlcmNsb3VkLmNvbS9hdmF0YXJzL21hc3Rlcm1pbmRlc2lnbl8xMjguanBnIiwidXJsIjoiaHR0cHM6Ly9qYXZpZXIub3JnIn0sInNmcCI6ImJaTFZkb28zVVI1VlVhaC92emtDWEF6UzkzZzJCU3kvcUFuYStnOGcwMncifQ.uwbN3ffffffBToD8EPJNwaZHhKVUFgrW1IbMF06bSr-Y05f3o0FbuVP-ojJuzV8BzG_2ppyZwwtJMAVJzwNlNQ',
      resolver,
      supportedMethods
    ),
    {
      message: 'invalid_signature: Signature invalid for JWT'
    }
  )
})

test('verifyJWS: missing @id in jws', async (t) => {
  try {
    await verifyJWS(
      await createJWS(
        {
          peer: {
            '@context': 'https://www.schema.org/',
            '@type': 'Person',
            name: 'Erick Ryan',
            image: 'https://cdn.fakercloud.com/avatars/mastermindesign_128.jpg',
            url: 'https://javier.org'
          },
          sfp: 'bZLVdoo3UR5VUah/vzkCXAzS93g2BSy/qAna+g8g02w'
        },
        signers.ES256K(curve.generateSeedKeyPair('test').secretKey)
      ),
      resolver,
      supportedMethods
    )
  } catch (error) {
    t.deepEqual(error, new Error('Missing @id in jws'))
  }
})

test('VerifyJWS: should throw an error for unavailable did methods', async (t) => {
  const jws = await createJWS(
    {
      peer: {
        '@id': 'did:notkey:foobar',
        '@context': 'https://www.schema.org/',
        '@type': 'Person',
        name: 'Erick Ryan',
        image: 'https://cdn.fakercloud.com/avatars/mastermindesign_128.jpg',
        url: 'https://javier.org'
      },
      sfp: 'bZLVdoo3UR5VUah/vzkCXAzS93g2BSy/qAna+g8g02w'
    },
    signers.ES256K(curve.generateSeedKeyPair('test').secretKey)
  )

  await t.throwsAsync(async () => verifyJWS(jws, resolver, supportedMethods), {
    message:
      'Unsupported did method: did method should be one of: ["key"], instead got "notkey"'
  })
})
