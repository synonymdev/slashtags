import { createChallenger, createInitiatior } from './index.js';
import { base64url } from 'multiformats/bases/base64';
import secp256k1 from 'noise-curve-secp';

describe('Slashtags Auth', () => {
  it('demo', () => {
    // Create a challenger to manage sessions
    const challengerKeypair = secp256k1.generateKeyPair();
    const challenger = createChallenger({
      keypair: challengerKeypair,
      metadata: Buffer.from(JSON.stringify({ description: 'challenger' })),
    });
    const { challenge } = challenger.newChallenge(100);

    // Pass the challenge to the initiator somehow
    const initiatorKeypair = secp256k1.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      challengerPublicKey: challengerKeypair.publicKey,
      challenge: challenge,
      initiatorMetadata: Buffer.from(JSON.stringify({ name: 'foo' })),
    });

    // Pass the response to the challenger
    const {
      // Get the initiator metadata
      initiatorMetadata,
      // Prepare a response fro bidirectional authentication
      challengerResponse,
    } = challenger.verify(initiator.response);

    expect(initiatorMetadata).toEqual(
      Buffer.from(JSON.stringify({ name: 'foo' })),
    );

    // Finally pass the challenger response to the initiator
    const challengerResponesData = initiator.verify(challengerResponse);

    expect(challengerResponesData).toEqual({
      ChallengerMetadata: '{"description":"challenger"}',
      publicKey: base64url.encode(challengerKeypair.publicKey),
    });

    expect(
      // @ts-ignore
      Buffer.from(base64url.decode(challengerResponesData.publicKey)),
    ).toEqual(challengerKeypair.publicKey);
  });
});
