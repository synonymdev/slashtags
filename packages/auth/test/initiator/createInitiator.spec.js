// import { createInitiatior } from '../../src/initiator/index.js';
// import { createResponder } from '../../src/responder/index.js';
// import { generateChallenge } from '../../src/ec.js';
// import assert from 'assert';
// import { DEFAULT_CURVE } from '../../src/constants.js';

// describe('Slashtags Auth: Responder: createInitiatior()', () => {
//   it('should throw an error if the curve is not available', () => {
//     const challenge = generateChallenge();
//     const keypair = DEFAULT_CURVE.generateKeyPair();

//     let error;
//     try {
//       createInitiatior({
//         keypair,
//         responderPublicKey: Buffer.from(''),
//         challenge: challenge,
//       });
//     } catch (err) {
//       error = err;
//     }
//     assert.equal(
//       error.message,
//       "Responder's keypair were generated using a different curve",
//     );
//   });

//   it('should create an attestation to the challenge', () => {
//     const responderKeypair = DEFAULT_CURVE.generateKeyPair();
//     const responder = createResponder({ keypair: responderKeypair });
//     const { challenge } = responder.newChallenge(30);

//     const initiatorKeypair = DEFAULT_CURVE.generateKeyPair();
//     const initiator = createInitiatior({
//       keypair: initiatorKeypair,
//       responderPublicKey: responderKeypair.publicKey,
//       challenge: challenge,
//     });

//     assert.equal(initiator.attestation instanceof Buffer, true);

//     const { responderAttestation } = responder.verify(initiator.attestation);

//     const responderData = initiator.verify(responderAttestation);

//     assert.deepEqual(responderData, {
//       responderPublicKey: responderKeypair.publicKey.toString('hex'),
//     });
//   });
// });
