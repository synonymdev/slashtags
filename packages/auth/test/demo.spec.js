import { createInitiatior, createResponder } from '../src/index.js';
import secp256k1 from 'noise-curve-secp';

describe('Slashtags Auth', () => {
  it('demo', () => {
    // Create a responder to manage sessions
    const responderKeypair = secp256k1.generateKeyPair();
    const responder = createResponder({
      keypair: responderKeypair,
      metadata: { description: 'responder' },
    });
    // Create a new challenge with a timeout in miliseconds, and metadata (optional)
    const { challenge, responderPublicKey } = responder.newChallenge(100, {
      description: 'challenge', // override the default description
    });

    // Pass the challenge to the initiator somehow
    const initiatorKeypair = secp256k1.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      responderPublicKey: responderPublicKey,
      challenge: challenge,
      initiatorMetadata: { name: 'foo' },
    });

    // Pass the attestation to the responder
    const {
      // Get the initiator metadata
      initiatorMetadata,
      // Prepare an attestation for bidirectional authentication
      responderAttestation,
    } = responder.verify(initiator.attestation);

    expect(initiatorMetadata).toEqual({ name: 'foo' });

    // Finally pass the responder attestation to the initiator
    const responderPayload = initiator.verify(responderAttestation);

    expect(responderPayload).toEqual({
      responderMetadata: { description: 'challenge' },
      responderPublicKey: responderKeypair.publicKey.toString('hex'),
    });

    expect(responderPayload.responderPublicKey).toEqual(
      responderKeypair.publicKey.toString('hex'),
    );
  });
});
