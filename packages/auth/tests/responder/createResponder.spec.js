import { createResponder } from '../../src/responder/index';
import secp256k1 from 'noise-curve-secp';
import secp from 'noise-handshake/dh';

const keypair = secp256k1.generateKeyPair();

describe('Slashtags Auth: Responder: createResponder()', () => {
  it('should create a responder and expose sessions Map', () => {
    const responder = createResponder({ keypair });
    expect(responder.sessions).toBeInstanceOf(Map);
  });

  it('should expose all passed configs', () => {
    const responder = createResponder({ keypair });
    expect(responder.config).toEqual({
      keypair,
      curve: secp256k1,
      challengeLength: 32,
    });
  });

  it('should create new challengeObject', () => {
    const responder = createResponder({
      keypair,
      attestationURL: 'example.com',
      curve: secp,
    });

    const challengeObject = responder.newChallenge(10);

    expect(challengeObject).toEqual({
      challenge: challengeObject.challenge,
      responderPublicKey: keypair.publicKey,
      attestationURL: 'example.com',
    });
  });
});
