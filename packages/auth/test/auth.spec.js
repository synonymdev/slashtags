import test from 'ava'
import { Auth } from '../src/index.js'
import { signers } from '../src/signers.js'
import {
  didKeyFromPubKey,
  sessionFingerprint,
  verifyFactory
} from '../src/utils.js'
import { varint } from '@synonymdev/slashtags-common'
import { base32 } from 'multiformats/bases/base32'
import { Core } from '@synonymdev/slashtags-core'
import { secp256k1 as curve } from 'noise-curve-tiny-secp'
import { createJWS } from 'did-jwt'

const verify = verifyFactory();

(async () => {
  const keyPair = curve.generateSeedKeyPair('responder')
  /** @type {import ('../src/interfaces').Profile} */
  const profile = {
    '@id': null,
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'responder name',
    image: 'https://www.example.com/logo.png'
  }

  const node = await Core()
  const auth = await Auth(node)

  test('Issue a new ticket URL', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    t.deepEqual(url.protocol, 'slash:')
    t.deepEqual(url.searchParams.get('act'), '1')
    t.truthy(url.searchParams.get('tkt'))
  })

  test('Redeem ticket URL', async (t) => {
    const url = new URL(
      auth.issueURL({
        onRequest: () => ({ responder: { keyPair, profile } })
      })
    )

    const ticket = url.searchParams.get('tkt')
    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()
    const response = await node2.request(serverPublicKey, 'ACT1_INIT', {
      tkt: ticket
    })

    const validSFP = await sessionFingerprint(
      Array.from(node2._openSockets.values())[0],
      ticket
    )

    const verifiedResponse = await verify(
      response.body.proof,
      'did:key:zQ3shvrGQ5dRfTgG2ukXJqkgHeopnickw1FANCNcSojQyKyat'
    )

    t.deepEqual(verifiedResponse, { sfp: validSFP })
  })

  test('Clear callbacks after timeout', async (t) => {
    const url = new URL(
      auth.issueURL({
        onRequest: () => ({ responder: { keyPair, profile } }),
        timeout: 200
      })
    )

    const ticket = url.searchParams.get('tkt')

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve()
      }, 300)
    )

    t.deepEqual(auth._ticketConfigs.get(ticket), undefined)
  })

  test('ACT1_VERIFY: valid signature', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    const ticket = url.searchParams.get('tkt')
    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()
    await node2.request(serverPublicKey, 'ACT1_INIT', { tkt: ticket })

    const keyPairInitiator = curve.generateSeedKeyPair('initiator')

    const jws = await createJWS(
      {
        sfp: await sessionFingerprint(
          Array.from(node2._openSockets.values())[0],
          ticket
        )
      },
      signers.ES256K(keyPairInitiator.secretKey)
    )

    const response = await node2.request(serverPublicKey, 'ACT1_VERIFY', {
      jws,
      tkt: ticket,
      profile: {
        '@id': didKeyFromPubKey(keyPairInitiator.publicKey),
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'responder name',
        image: 'https://www.example.com/logo.png'
      }
    })

    t.deepEqual(response.body, { status: 'OK' })
  })

  test('invalid session fingerprint', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    const ticket = url.searchParams.get('tkt')
    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    const keyPairInitiator = curve.generateSeedKeyPair('initiator')

    const jws = await createJWS(
      {
        sfp: await sessionFingerprint(
          { noiseSocket: { handshakeHash: Buffer.from('wrong') } },
          ticket
        )
      },
      signers.ES256K(keyPairInitiator.secretKey)
    )

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', {
        jws,
        tkt: ticket,
        profile: {
          '@id': didKeyFromPubKey(keyPairInitiator.publicKey),
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'responder name',
          image: 'https://www.example.com/logo.png'
        }
      })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Invalid session fingerprint'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('Redeem ticket: Missing param tkt', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_INIT', {})
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Missing param: tkt'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('Redeem ticket: ticket not found', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_INIT', { tkt: 'foo' })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Ticket "foo" not found'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('verifyJWS: Missing param: tkt', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', {})
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Missing param: tkt'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('verifyJWS: Missing param: jws', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', { tkt: '' })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Missing param: jws'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('verifyJWS:  ticket not found', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', {
        tkt: '',
        jws: '',
        profile: { '@id': 'x' }
      })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Ticket "" not found'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('verifyJWS: id not found', async (t) => {
    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', {
        tkt: '',
        jws: '',
        profile: {}
      })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'Missing param: profile["@id"]'
        },
        id: 0,
        jsonrpc: '2.0'
      })
    }
  })

  test('Accept other did resolvers', async (t) => {
    const node = await Core()
    const auth = await Auth(node, {
      didResolverRegistry: {
        key: async () => {
          throw new Error('override didResolverRegistry')
        }
      }
    })

    const url = new URL(
      auth.issueURL({ onRequest: () => ({ responder: { keyPair, profile } }) })
    )

    const ticket = url.searchParams.get('tkt')
    let res = varint.split(base32.decode(url.hostname))
    res = varint.split(res[1])

    const serverPublicKey = Buffer.from(res[1])

    const node2 = await Core()
    await node2.request(serverPublicKey, 'ACT1_INIT', { tkt: ticket })

    const keyPairInitiator = curve.generateSeedKeyPair('initiator')

    const jws = await createJWS(
      {
        sfp: await sessionFingerprint(
          Array.from(node2._openSockets.values())[0],
          ticket
        )
      },
      signers.ES256K(keyPairInitiator.secretKey)
    )

    try {
      await node2.request(serverPublicKey, 'ACT1_VERIFY', {
        jws,
        tkt: ticket,
        profile: {
          '@id': didKeyFromPubKey(keyPairInitiator.publicKey),
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'responder name',
          image: 'https://www.example.com/logo.png'
        }
      })
    } catch (error) {
      t.deepEqual(error, {
        error: {
          code: -32000,
          message: 'override didResolverRegistry'
        },
        id: 1,
        jsonrpc: '2.0'
      })
    }
  })
})()
