import { createInitiatior } from '../index';
import secp256k1 from 'noise-curve-secp';
import { encodeChallenge } from '../../utils';
import { generateChallenge, createChallenger } from '../../challenger';
import { base64url } from 'multiformats/bases/base64';

describe('Slashtags Auth: Challenger: createInitiatior()', () => {
  it('should throw an error if the curve is not available', () => {
    const challenge = generateChallenge();
    const encoded = encodeChallenge('not-available', challenge);
    const keypair = secp256k1.generateKeyPair();

    try {
      createInitiatior({
        keypair,
        challengerPublicKey: Buffer.from(''),
        challenge: encoded,
      });
    } catch (error) {
      expect(error.message).toBe(
        'No suitable curve provided for: not-available',
      );
    }
  });

  it('should create a response to the challenge', () => {
    const challengerKeypair = secp256k1.generateKeyPair();
    const challenger = createChallenger({ keypair: challengerKeypair });
    const { challenge } = challenger.newChallenge(30);

    const initiatorKeypair = secp256k1.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      challengerPublicKey: challengerKeypair.publicKey,
      challenge: challenge,
    });

    expect(initiator.response).toBeInstanceOf(Buffer);

    const { challengerResponse } = challenger.verify(initiator.response);

    const challenegerData = initiator.verify(challengerResponse);
    expect(challenegerData).toEqual({
      publicKey: base64url.encode(challengerKeypair.publicKey),
    });
  });
});
