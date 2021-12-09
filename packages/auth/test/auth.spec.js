import test from 'ava'
import { Auth, signers, didKeyFromPubKey } from '../src/index.js'
import { varint } from '@synonymdev/slashtags-common'
import { base32 } from 'multiformats/bases/base32'
import { Core } from '@synonymdev/slashtags-core'
import { secp256k1 as curve } from 'noise-curve-tiny-secp'
import { sessionFingerprint, verifyJWS } from '../src/utils.js'
import { createJWS } from 'did-jwt'

const keyPair = curve.generateSeedKeyPair('responder')
const metadata = {
  name: 'responder name',
  image: 'https://www.example.com/logo.png'
}

let auth

test.before(async () => {
  const slash = await Core()
  auth = await Auth(slash)
})

test('Issue a new ticket URL', async (t) => {
  const url = new URL(
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
  )

  t.deepEqual(url.protocol, 'slash:')
  t.deepEqual(url.searchParams.get('act'), '1')
  t.truthy(url.searchParams.get('tkt'))
})

test('Redeem ticket URL', async (t) => {
  const url = new URL(
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
  )

  const ticket = url.searchParams.get('tkt')
  let res = varint.split(base32.decode(url.hostname))
  res = varint.split(res[1])

  const serverPublicKey = Buffer.from(res[1])

  const node2 = await Core()
  const response = await node2.request(serverPublicKey, 'ACT1_INIT', {
    tkt: ticket
  })

  const sessionFingerPrint = await sessionFingerprint(
    Array.from(node2._openSockets.values())[0],
    ticket
  )

  const verifiedResponse = await verifyJWS(response.body)

  t.deepEqual(verifiedResponse, {
    peer: {
      '@id': 'did:key:zQ3shvrGQ5dRfTgG2ukXJqkgHeopnickw1FANCNcSojQyKyat',
      ...metadata
    },
    sfp: sessionFingerPrint
  })
})

test('VerifyJWS: should throw an error for unavailable did methods', async (t) => {
  const jws = await createJWS(
    {
      peer: {
        '@id': 'did:notkey:foobar',
        ...metadata
      },
      handshakeHash: Buffer.from('')
    },
    signers.ES256K(keyPair.secretKey)
  )

  await t.throwsAsync(async () => verifyJWS(jws), {
    message:
      'Unsupported did method: did method should be one of: ["key"], instead got "notkey"'
  })
})

test('Clear callbacks after timeout', async (t) => {
  const ticketConfig = {
    peer: {
      ...metadata,
      '@id': 'did:key:zQ3shvrGQ5dRfTgG2ukXJqkgHeopnickw1FANCNcSojQyKyat'
    }
  }

  const url = new URL(
    auth.issueURL({
      respondAs: { signer: { keyPair }, metadata },
      onVerify: ticketConfig.onVerify,
      timeout: 200
    })
  )
  const ticket = url.searchParams.get('tkt')

  t.deepEqual(auth._ticketConfigs.get(ticket).peer, ticketConfig.peer)

  await new Promise((resolve) =>
    setTimeout(() => {
      resolve()
    }, 300)
  )

  t.deepEqual(auth._ticketConfigs.get(ticket), undefined)
})

test('ACT1_VERIFY: valid signature', async (t) => {
  const url = new URL(
    auth.issueURL({
      respondAs: { signer: { keyPair }, metadata },
      onVerify: (peer) => {
        return {
          feeds: [
            {
              name: 'feed1',
              schema: 'slash://someschema/',
              src: 'slash://feed1/'
            },
            {
              name: 'feed2',
              schema: 'slash://someotherschema/',
              src: 'slash://feed2/'
            }
          ]
        }
      }
    })
  )

  const ticket = url.searchParams.get('tkt')
  let res = varint.split(base32.decode(url.hostname))
  res = varint.split(res[1])

  const serverPublicKey = Buffer.from(res[1])

  const node2 = await Core()
  await node2.request(serverPublicKey, 'ACT1_INIT', { tkt: ticket })

  const keyPairInitiator = curve.generateSeedKeyPair('initiator')
  const metadataInitiator = {
    name: 'initiator name',
    image: 'https://www.example.com/logo2.png'
  }

  const jws = await createJWS(
    {
      peer: {
        '@id': didKeyFromPubKey(keyPairInitiator.publicKey),
        metadata: metadataInitiator
      },
      sfp: await sessionFingerprint(
        Array.from(node2._openSockets.values())[0],
        ticket
      )
    },
    signers.ES256K(keyPairInitiator.secretKey)
  )

  const response = await node2.request(serverPublicKey, 'ACT1_VERIFY', {
    jws,
    tkt: ticket
  })

  t.deepEqual(response.body, {
    feeds: [
      {
        name: 'feed1',
        schema: 'slash://someschema/',
        src: 'slash://feed1/'
      },
      {
        name: 'feed2',
        schema: 'slash://someotherschema/',
        src: 'slash://feed2/'
      }
    ],
    status: 'OK'
  })
})

test('invalid session fingerprint', async (t) => {
  const url = new URL(
    auth.issueURL({
      respondAs: { signer: { keyPair }, metadata },
      onVerify: () => {}
    })
  )

  const ticket = url.searchParams.get('tkt')
  let res = varint.split(base32.decode(url.hostname))
  res = varint.split(res[1])

  const serverPublicKey = Buffer.from(res[1])

  const node2 = await Core()

  const keyPairInitiator = curve.generateSeedKeyPair('initiator')
  const metadataInitiator = {
    name: 'initiator name',
    image: 'https://www.example.com/logo2.png'
  }

  const jws = await createJWS(
    {
      peer: {
        '@id': didKeyFromPubKey(keyPairInitiator.publicKey),
        metadata: metadataInitiator
      },
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
      tkt: ticket
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
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
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
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
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
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
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
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
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
    auth.issueURL({ respondAs: { signer: { keyPair }, metadata } })
  )

  let res = varint.split(base32.decode(url.hostname))
  res = varint.split(res[1])

  const serverPublicKey = Buffer.from(res[1])

  const node2 = await Core()

  try {
    await node2.request(serverPublicKey, 'ACT1_VERIFY', { tkt: '', jws: '' })
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
