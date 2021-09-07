import assert from 'assert';
import { createAuth } from '../src/index.js';
import { generateChallenge } from '../src/crypto.js';
import { DEFAULT_CURVE } from '../src/constants.js';

describe('Slashtags Auth: Responder: createInitiatior()', () => {
  it('should throw an error if the curve is not available', () => {
    // const challenge = generateChallenge();
    // const keypair = DEFAULT_CURVE.generateKeyPair();
    // let error;
    // try {
    //   createInitiatior({
    //     keypair,
    //     responderPublicKey: Buffer.from(''),
    //     challenge: challenge,
    //   });
    // } catch (err) {
    //   error = err;
    // }
    // assert.equal(
    //   error.message,
    //   "Responder's keypair were generated using a different curve",
    // );
  });

  //   it('should create an attestation to the challenge', () => {
  //     const initiatorKeypair = DEFAULT_CURVE.generateKeyPair();
  //     const responderKeypair = DEFAULT_CURVE.generateKeyPair();

  //     const initiator = createAuth(initiatorKeypair);
  //     const responder = createAuth(initiatorKeypair);
  //     const challenge = generateChallenge();

  //     const attestation = initiator.attest(responderKeypair.publicKey, challenge);

  //     assert.equal(attestation instanceof Buffer, true);

  //     const { responderAttestation } = responder.verify(initiator.attestation);

  //     const responderData = initiator.verify(responderAttestation);

  //     assert.deepEqual(responderData, {
  //       responderPublicKey: responderKeypair.publicKey.toString('hex'),
  //     });
  //   });
});
