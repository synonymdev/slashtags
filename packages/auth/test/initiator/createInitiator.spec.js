import { createInitiatior } from '../../src/initiator/index.js';
import { encodeChallenge } from '../../src/utils/index.js';
import {
  generateChallenge,
  createResponder,
} from '../../src/responder/index.js';
import assert from 'assert';
import { DEFAULT_CURVE } from '../../src/constants.js';

describe('Slashtags Auth: Responder: createInitiatior()', () => {
  it('should throw an error if the curve is not available', () => {
    const challenge = generateChallenge();
    const encoded = encodeChallenge('not-available', challenge);
    const keypair = DEFAULT_CURVE.generateKeyPair();

    let error;
    try {
      createInitiatior({
        keypair,
        responderPublicKey: Buffer.from(''),
        challenge: encoded,
      });
    } catch (err) {
      error = err;
    }
    assert.equal(
      error.message,
      'No suitable curve provided for: not-available',
    );
  });

  it('should create an attestation to the challenge', () => {
    const responderKeypair = DEFAULT_CURVE.generateKeyPair();
    const responder = createResponder({ keypair: responderKeypair });
    const { challenge } = responder.newChallenge(30);

    const initiatorKeypair = DEFAULT_CURVE.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      responderPublicKey: responderKeypair.publicKey,
      challenge: challenge,
    });

    assert.equal(initiator.attestation instanceof Buffer, true);

    const { responderAttestation } = responder.verify(initiator.attestation);

    const responderData = initiator.verify(responderAttestation);

    assert.deepEqual(responderData, {
      responderPublicKey: responderKeypair.publicKey.toString('hex'),
    });
  });

  it('should accept a list of curves', () => {
    const responderKeypair = DEFAULT_CURVE.generateKeyPair();
    const responder = createResponder({ keypair: responderKeypair });
    const { challenge } = responder.newChallenge(30);

    const initiatorKeypair = DEFAULT_CURVE.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      responderPublicKey: responderKeypair.publicKey,
      challenge: challenge,
      curve: [DEFAULT_CURVE],
    });

    assert.equal(initiator.attestation instanceof Buffer, true);

    const { responderAttestation } = responder.verify(initiator.attestation);

    const responderData = initiator.verify(responderAttestation);

    assert.deepEqual(responderData, {
      responderPublicKey: responderKeypair.publicKey.toString('hex'),
    });
  });
});
