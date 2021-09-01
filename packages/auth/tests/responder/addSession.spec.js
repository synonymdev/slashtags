import { addSession, generateChallenge } from '../../src/responder/index';

describe('Slashtags Auth: Responder: addSession()', () => {
  it('should create a new session and add it to the passed sessions map', () => {
    const sessions = new Map();
    const challenge = generateChallenge();
    addSession({ sessions, timeout: 10, challenge: challenge });

    const session = sessions.get(challenge.toString('hex'));

    expect(session).toEqual({ challenge: challenge, timer: session.timer });
    expect(session.timer).toHaveProperty('_destroyed');
  });

  it('should be automatically removed from the passed sessions after timeout', async () => {
    const sessions = new Map();
    const challenge = generateChallenge();
    addSession({ sessions, timeout: 10, challenge: challenge });

    const session = sessions.get(challenge.toString('hex'));

    expect(session.timer._destroyed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 11));

    expect(session.timer._destroyed).toBe(true);
    expect(sessions.get(challenge.toString('hex'))).toEqual(undefined);
  });
});
