import test from 'ava'
import { Actions } from '../src/index.js'
import { RPC } from '@synonymdev/slashtags-rpc'
import {
  Auth,
  createJWS,
  didKeyFromPubKey,
  sessionFingerprint,
  signers
} from '@synonymdev/slashtags-auth'
import { base32 } from 'multiformats/bases/base32'
import { varint } from '@synonymdev/slashtags-common'
import { secp256k1 as curve } from 'noise-curve-tiny-secp';

(async () => {
  const auth = await Auth(await RPC())
  const actions = await Actions(await RPC())

  const responderKeypair = curve.generateSeedKeyPair('remote')

  /** @type {Profile} */
  const responderProfile = {
    '@id': didKeyFromPubKey(responderKeypair.publicKey),
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'responder name',
    image: 'https://www.example.com/logo.png'
  }

  test('Handle ACT1', async (t) => {
    const responderAdditionalItems = [
      {
        '@id': 'x',
        '@context': 'https://schema.org',
        '@type': 'Form',
        schema: { foo: 'bar' }
      }
    ]

    const initiatorResponseAdditionalItems = [
      {
        '@id': 'y',
        '@context': 'https://schema.org',
        '@type': 'FormData',
        data: { foo: 'bar' }
      }
    ]

    const feeds = [
      {
        '@id': 'z',
        '@context': 'https://example.com',
        '@type': 'Feed',
        data: { foo: 'bar' }
      }
    ]

    const initiatorKeypair = curve.generateSeedKeyPair('local')

    /** @type {Profile} */
    const initiatorProfile = {
      '@id': didKeyFromPubKey(initiatorKeypair.publicKey),
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'initiator name',
      image: 'https://www.example.com/logo2.png'
    }

    const url = auth.issueURL({
      onRequest: () => ({
        responder: { keyPair: responderKeypair, profile: responderProfile },
        additionalItems: responderAdditionalItems
      }),
      onSuccess: (conn, additionalItems) => {
        t.deepEqual(
          conn.remote,
          initiatorProfile,
          'oSuccess: conn.remote is initiator'
        )
        t.deepEqual(
          conn.local,
          responderProfile,
          'onSuccess: conn.local is responder'
        )
        t.deepEqual(
          additionalItems,
          initiatorResponseAdditionalItems,
          'oSuccess: additionalItems are correct'
        )

        return {
          additionalItems: feeds
        }
      }
    })

    await actions.handle(
      url,
      {
        ACT1: {
          onResponse: (peer, additionalItems) => {
            t.deepEqual(
              peer,
              responderProfile,
              'onResponse: peer is responder'
            )
            t.deepEqual(
              additionalItems,
              responderAdditionalItems,
              'onResponse: additionalItems are correct'
            )

            return {
              initiator: {
                keyPair: initiatorKeypair,
                profile: initiatorProfile
              },
              additionalItems: initiatorResponseAdditionalItems
            }
          },
          onSuccess: ({ local, remote }, additionalItems) => {
            t.deepEqual(
              local,
              initiatorProfile,
              'onSuccess: local is initiator'
            )
            t.deepEqual(
              remote,
              responderProfile,
              'onSuccess: remote is responder'
            )
            t.deepEqual(
              additionalItems,
              feeds,
              'onSuccess: additionalItems are correct'
            )
          }
        }
      },
      (error) => {
        t.fail(error.message)
      }
    )
  })

  test('Pass unknown errors to onError', async (t) => {
    const url = auth.issueURL({
      onRequest: () => ({
        responder: { keyPair: responderKeypair, profile: responderProfile }
      }),
      timeout: 100
    })

    const ticket = new URL(url).searchParams.get('tkt')

    await actions.handle(
      url,
      {
        ACT1: {
          onResponse: () => null,
          onSuccess: () => null
        }
      },
      (error) => {
        t.deepEqual(error, {
          code: 'TicketNotFound',
          message: `Ticket "${ticket}" not found`,
          url
        })
      }
    )
  })

  test('Pass error object to onError on missing param: tkt', async (t) => {
    let url = auth.issueURL({
      onRequest: () => ({
        responder: { keyPair: responderKeypair, profile: responderProfile }
      })
    })

    url = url.replace('tkt', 'nottkt')

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'MalformedURL',
        message: 'Missing param: tkt',
        url
      })
    })
  })

  test('Pass error object to onError on missing param: act', async (t) => {
    let url = auth.issueURL({
      onRequest: () => ({
        responder: { keyPair: responderKeypair, profile: responderProfile }
      })
    })

    url = url.replace('act', 'notact')

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'MalformedURL',
        message: 'Missing param: act',
        url
      })
    })
  })

  test('Pass error object to onError on unsupported action', async (t) => {
    let url = auth.issueURL({
      onRequest: () => ({
        responder: { keyPair: responderKeypair, profile: responderProfile }
      })
    })

    url = url.replace('1', '21000000')

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'UnsupportedAction',
        message:
          'Unsupported action: actions must be one of: ["ACT1"], but got: "ACT21000000"',
        url
      })
    })
  })

  test('MITM: throw an error on invalid session fingerprint', async (t) => {
    const node1 = await RPC()
    const destination = await node1.listen()

    node1.addMethods({
      ACT1_INIT: async (request) => {
        const sfp = await sessionFingerprint(request, 'foo')

        const keyPair = curve.generateSeedKeyPair('test')

        return {
          proof: await createJWS({ sfp }, signers.ES256K(keyPair.secretKey)),
          profile: {
            '@id': didKeyFromPubKey(keyPair.publicKey),
            '@context': 'https://www.schema.org/',
            '@type': 'Person',
            name: 'Erick Ryan',
            image: 'https://cdn.fakercloud.com/avatars/mastermindesign_128.jpg',
            url: 'https://javier.org'
          }
        }
      }
    })

    const node2 = await RPC()
    const destination2 = await node2.listen()
    const address2 = base32.encode(varint.prepend([135, 0], destination2))

    node2.addMethods({
      ACT1_INIT: async (request) => {
        const response = await node2.request(destination, 'ACT1_INIT', {})
        return response.body
      }
    })

    const url = 'slash://' + address2 + '?act=1&tkt=foo'

    const node3 = await RPC()
    const actions = Actions(node3)

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'InvalidSessionFingerprint',
        url
      })
    })
  })

  test('Default to did:key if no "@id" was found in the profile', async (t) => {
    const initiatorKeypair = curve.generateSeedKeyPair('local')

    /** @type {Profile} */
    const initiatorProfile = {
      '@id': null,
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'initiator name',
      image: 'https://www.example.com/logo2.png'
    }

    const url = auth.issueURL({
      onRequest: () => ({
        responder: {
          keyPair: responderKeypair,
          profile: responderProfile
        }
      }),
      onSuccess: ({ remote }) => {
        t.deepEqual(remote, initiatorProfile)
      }
    })

    await actions.handle(
      url,
      {
        ACT1: {
          onResponse: () => ({
            initiator: {
              keyPair: initiatorKeypair,
              profile: initiatorProfile
            }
          }),
          onSuccess: () => {
            t.pass('onSuccess: did:key was set correctly')
          }
        }
      },
      (error) => {
        // @ts-ignore
        t.fail(error.message || error)
      }
    )
  })
})()

/** @typedef {import ('@synonymdev/slashtags-auth').Profile} Profile */
