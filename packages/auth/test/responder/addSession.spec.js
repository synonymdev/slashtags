// import { addSession } from '../../src/responder/index.js';
// import { generateChallenge } from '../../src/ec.js';
// import assert from 'assert';

// describe('Slashtags Auth: Responder: addSession()', () => {
//   it('should create a new session and add it to the passed sessions map', () => {
//     const sessions = new Map();
//     const challenge = generateChallenge();
//     addSession({ sessions, timeout: 10, challenge: challenge });

//     const session = sessions.get(challenge.toString('hex'));

//     assert.deepEqual(session, {
//       challenge: challenge,
//       timer: session.timer,
//       responderMetdata: undefined,
//     });
//     assert.equal(session.timer._destroyed, false);
//   });

//   it('should be automatically removed from the passed sessions after timeout', async () => {
//     const sessions = new Map();
//     const challenge = generateChallenge();
//     addSession({ sessions, timeout: 10, challenge: challenge });

//     const session = sessions.get(challenge.toString('hex'));

//     assert.equal(session.timer._destroyed, false);

//     await new Promise((resolve) => setTimeout(resolve, 11));

//     assert.equal(session.timer._destroyed, true);
//     assert.equal(sessions.get(challenge.toString('hex')), undefined);
//   });
// });
