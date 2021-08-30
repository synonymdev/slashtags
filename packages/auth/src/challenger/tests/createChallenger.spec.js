import { createChallenger } from '../index';
import secp256k1 from 'noise-curve-secp';
import secp from 'noise-handshake/dh';

const keypair = secp256k1.generateKeyPair();

describe('Slashtags Auth: Challenger: createChallenger()', () => {
  it('should create a challenger and expose sessions Map', () => {
    const challenger = createChallenger({ keypair });
    expect(challenger.sessions).toBeInstanceOf(Map);
  });

  it('should expose all passed configs', () => {
    const challenger = createChallenger({ keypair });
    expect(challenger.config).toEqual({
      keypair,
      curve: secp256k1,
      challengeLength: 32,
    });
  });

  it('should create new challengeObject', () => {
    const challenger = createChallenger({
      keypair,
      responseURL: 'example.com',
      curve: secp,
    });

    const challengeObject = challenger.newChallenge(10);

    expect(challengeObject).toEqual({
      challenge: challengeObject.challenge,
      challengerPublicKey: keypair.publicKey,
      responseURL: 'example.com',
    });
  });
});
