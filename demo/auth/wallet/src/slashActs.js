// @ts-ignore
import URI from 'urijs';
import { base32 } from 'multiformats/bases/base32';
import { varint } from '@synonymdev/slashtags-common';
import { Core } from '@synonymdev/slashtags-core';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import { createAuth } from '@synonymdev/slashtags-auth';

const basicProfile = { foo: 'bar' };

const keyPair = curve.generateSeedKeyPair('some user');
const auth = createAuth(keyPair, { metadata: basicProfile });

export const parseURL = (url) => {
  const uri = new URI(url);

  const query = URI.parseQuery(uri.query());

  return { hostname: uri._parts.hostname, query };
};

const processAddress = (address) => {
  const bytes = base32.decode(address);

  let [_, rest, __] = varint.split(bytes);
  [_, rest] = varint.split(rest);
  [_, rest] = varint.split(rest);

  return new URL(Buffer.from(rest).toString()).toString();
};

window.run = async (url) => {
  url =
    url ||
    'slash://b2iaqaadxom5c6l3mn5rwc3din5zxiorzgayda/?act=1&tkt=zqsD7mmoFyg';

  const { hostname, query } = parseURL(url);

  const wsURL = processAddress(hostname);

  const node = await Core();
  const { challenge, publicKey } = await node.request(
    wsURL,
    'ACT_1/GET_CHALLENGE',
    {},
  );
  console.log('challenge', challenge);

  const { attestation, verifyResponder } = auth.initiator.respond(
    Buffer.from(publicKey, 'hex'),
    Buffer.from(challenge, 'hex'),
  );
  console.log('attestation', attestation);

  const answer = await node.request(wsURL, 'ACT_1/RESPOND', {
    attestation: Buffer.from(attestation).toString('hex'),
    ticket: query.tkt,
  });

  console.log('answer', answer);

  const { attestation: responderAttestation } = answer;
  console.log(responderAttestation);

  const final = verifyResponder(Buffer.from(responderAttestation, 'hex'));
  console.log(final);

  return final;
};
