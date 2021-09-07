import { createAuth } from '../src/authenticator.js';
import { DEFAULT_CHALLENGE_LENGTH, DEFAULT_CURVE } from '../src/constants.js';
import assert from 'assert';
import { sessionID } from '../src/sessions.js';
import * as varint from '../src/varint.js';

const keypair = DEFAULT_CURVE.generateKeyPair();

// Remove the version prefix and slice with the public key length
const getChallenge = (msg, auth) =>
  varint.split(msg)[1].slice(auth.config.curve.PKLEN);

describe('Slashtags Auth: Responder: newChallenge()', () => {
  it('should create new encoded challenge message', () => {
    const authenticator = createAuth(keypair);

    const message = authenticator.newChallenge(10);
    const codeLen = varint.split(message)[2];

    assert.deepEqual(
      message.slice(codeLen, authenticator.config.curve.PKLEN + codeLen),
      keypair.publicKey,
    );

    assert.deepEqual(
      getChallenge(message, authenticator).length,
      DEFAULT_CHALLENGE_LENGTH,
    );
  });

  it('should save the newly created challenge in the sessions map', () => {
    const authenticator = createAuth(keypair);
    const message = authenticator.newChallenge(10);

    const challenge = getChallenge(message, authenticator);

    const id = sessionID(challenge);
    const session = authenticator.sessions.get(id);

    assert.deepEqual(session, {
      challenge: challenge,
      metadata: new Uint8Array(0),
      timer: session.timer,
    });

    // @ts-ignore
    assert.equal(session.timer._destroyed, false);
  });

  it('should save the global metdata in the session', () => {
    const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } });
    const message = authenticator.newChallenge(10);

    const challenge = getChallenge(message, authenticator);
    const id = sessionID(challenge);
    const session = authenticator.sessions.get(id);

    assert.deepEqual(session, {
      challenge: challenge,
      metadata: new TextEncoder().encode(JSON.stringify({ foo: 'bar' })),
      timer: session.timer,
    });
  });

  it('should save the overriding session metadata in the session', () => {
    const authenticator = createAuth(keypair, { metadata: { foo: 'bar' } });
    const message = authenticator.newChallenge(10, { foo: 'zar' });

    const challenge = getChallenge(message, authenticator);
    const id = sessionID(challenge);
    const session = authenticator.sessions.get(id);

    assert.deepEqual(session, {
      challenge: challenge,
      metadata: new TextEncoder().encode(JSON.stringify({ foo: 'zar' })),
      timer: session.timer,
    });
  });

  it('should remove the challenge from sessions after timeout', async () => {
    const authenticator = createAuth(keypair);
    const message = authenticator.newChallenge(10);

    const challenge = getChallenge(message, authenticator);
    const id = sessionID(challenge);
    const session = authenticator.sessions.get(id);

    // @ts-ignore
    assert.equal(session.timer._destroyed, false);

    await new Promise((resolve) => setTimeout(resolve, 11));

    // @ts-ignore
    assert.equal(session.timer._destroyed, true);
    assert.equal(authenticator.sessions.get(id), undefined);
  });
});
