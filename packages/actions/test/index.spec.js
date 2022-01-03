import test from 'ava';
import { Actions } from '../src/index.js';
import { RPC } from '@synonymdev/slashtags-rpc';
import {
  Auth,
  createJWS,
  didKeyFromPubKey,
  sessionFingerprint,
  signers,
} from '@synonymdev/slashtags-auth';
import { base32 } from 'multiformats/bases/base32';
import { varint } from '@synonymdev/slashtags-common';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';

(async () => {
  const auth = await Auth(await RPC());
  const actions = await Actions(await RPC());

  const keyPair = curve.generateSeedKeyPair('remote');

  /** @type {Profile} */
  const responderProfile = {
    '@id': 'did:key:foo',
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'responder name',
    image: 'https://www.example.com/logo.png',
  };

  test('Handle ACT1', async (t) => {
    const initialMetadata = [
      {
        '@id': 'x',
        '@context': 'https://schema.org',
        '@type': 'Form',
        schema: { foo: 'bar' },
      },
    ];

    const initiatorResponseAdditionalItems = [
      {
        '@id': 'y',
        '@context': 'https://schema.org',
        '@type': 'FormData',
        data: { foo: 'bar' },
      },
    ];

    const feeds = [
      {
        '@id': 'z',
        '@context': 'https://example.com',
        '@type': 'Feed',
        data: { foo: 'bar' },
      },
    ];

    /** @type {Profile} */
    const initiatorProfile = {
      '@id': 'did:key:bar',
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'initiator name',
      image: 'https://www.example.com/logo2.png',
    };

    const url = auth.issueURL({
      onInit: () => ({
        responder: { keyPair, profile: responderProfile },
        additionalItems: initialMetadata,
      }),
      onVerify: (peer, additionalItems) => {
        console.log({ peer, additionalItems });
        t.deepEqual(peer, initiatorProfile);
        t.deepEqual(additionalItems, initiatorResponseAdditionalItems);

        return {
          additionalItems: feeds,
        };
      },
    });

    await actions.handle(url, {
      ACT1: {
        onInitialResponse: (peer, metadata) => {
          t.deepEqual(peer, {
            '@id': 'did:key:zQ3shW3WHr7orXpW6UTJTGghCkHi2k22bWLD3ANyhEvAxmKGX',
            ...responderProfile,
          });

          t.deepEqual(metadata, initialMetadata);

          return {
            initiator: {
              keyPair: curve.generateSeedKeyPair('local'),
              profile: initiatorProfile,
            },
            additionalItems: initiatorResponseAdditionalItems,
          };
        },
        onConnection: ({ local, remote }, metadata) => {
          t.deepEqual(local, {
            '@id': 'did:key:zQ3shZX8ywf6B9J9xLq1Mnz9C95T3smbVx8ya2rXNaXGDijhF',
            ...initiatorProfile,
          });
          t.deepEqual(remote, {
            '@id': 'did:key:zQ3shW3WHr7orXpW6UTJTGghCkHi2k22bWLD3ANyhEvAxmKGX',
            ...responderProfile,
          });
          t.deepEqual(metadata, feeds);
        },
      },
    });
  });

  test('Pass unknown errors to onError', async (t) => {
    const url = auth.issueURL({
      onInit: () => ({
        responder: { keyPair, profile: responderProfile },
      }),
      timeout: 100,
    });

    const ticket = new URL(url).searchParams.get('tkt');

    await actions.handle(
      url,
      {
        ACT1: {
          onInitialResponse: () => null,
          onConnection: () => null,
        },
      },
      (error) => {
        t.deepEqual(error, {
          code: 'TicketNotFound',
          message: `Ticket "${ticket}" not found`,
          url,
        });
      },
    );
  });

  test('Pass error object to onError on missing param: tkt', async (t) => {
    let url = auth.issueURL({
      onInit: () => ({
        responder: { keyPair, profile: responderProfile },
      }),
    });

    url = url.replace('tkt', 'nottkt');

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'MalformedURL',
        message: 'Missing param: tkt',
        url,
      });
    });
  });

  test('Pass error object to onError on missing param: act', async (t) => {
    let url = auth.issueURL({
      onInit: () => ({
        responder: { keyPair, profile: responderProfile },
      }),
    });

    url = url.replace('act', 'notact');

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'MalformedURL',
        message: 'Missing param: act',
        url,
      });
    });
  });

  test('Pass error object to onError on unsupported action', async (t) => {
    let url = auth.issueURL({
      onInit: () => ({
        responder: { keyPair, profile: responderProfile },
      }),
    });

    url = url.replace('1', '21000000');

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'UnsupportedAction',
        message:
          'Unsupported action: actions must be one of: ["ACT1"], but got: "ACT21000000"',
        url,
      });
    });
  });

  test('MITM: throw an error on invalid session fingerprint', async (t) => {
    const node1 = await RPC();
    const destination = await node1.listen();

    node1.addMethods({
      ACT1_INIT: async (request) => {
        const sfp = await sessionFingerprint(request, 'foo');

        const keyPair = curve.generateSeedKeyPair('test');

        return {
          proof: await createJWS({ sfp }, signers.ES256K(keyPair.secretKey)),
          profile: {
            '@id': didKeyFromPubKey(keyPair.publicKey),
            '@context': 'https://www.schema.org/',
            '@type': 'Person',
            name: 'Erick Ryan',
            image: 'https://cdn.fakercloud.com/avatars/mastermindesign_128.jpg',
            url: 'https://javier.org',
          },
        };
      },
    });

    const node2 = await RPC();
    const destination2 = await node2.listen();
    const address2 = base32.encode(varint.prepend([135, 0], destination2));

    node2.addMethods({
      ACT1_INIT: async (request) => {
        const response = await node2.request(destination, 'ACT1_INIT', {});
        return response.body;
      },
    });

    const url = 'slash://' + address2 + '?act=1&tkt=foo';

    const node3 = await RPC();
    const actions = Actions(node3);

    await actions.handle(url, {}, (error) => {
      t.deepEqual(error, {
        code: 'InvalidSessionFingerprint',
        url,
      });
    });
  });
})();

/** @typedef {import ('@synonymdev/slashtags-auth').Profile} Profile */
