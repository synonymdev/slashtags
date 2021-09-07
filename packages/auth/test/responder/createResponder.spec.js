// import { createResponder } from '../../src/responder/index.js';
// import { DEFAULT_CURVE } from '../../src/constants.js';
// import secp from 'noise-handshake/dh.js';
// import assert from 'assert';

// const keypair = DEFAULT_CURVE.generateKeyPair();

// describe('Slashtags Auth: Responder: createResponder()', () => {
//   it('should create a responder and expose sessions Map', () => {
//     const responder = createResponder({ keypair });
//     assert.equal(responder.sessions instanceof Map, true);
//   });

//   it('should expose all passed configs', () => {
//     const responder = createResponder({ keypair });
//     assert.deepEqual(responder.config, {
//       keypair,
//       curve: DEFAULT_CURVE,
//       challengeLength: 32,
//     });
//   });

//   it('should create new challengeObject', () => {
//     const responder = createResponder({
//       keypair,
//       attestationURL: 'example.com',
//       curve: secp,
//     });

//     const challengeObject = responder.newChallenge(10);

//     assert.deepEqual(challengeObject, {
//       challenge: challengeObject.challenge,
//       responderPublicKey: keypair.publicKey,
//       attestationURL: 'example.com',
//     });
//   });
// });
