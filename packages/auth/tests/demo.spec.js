import { createInitiatior, createResponder } from '../index.js';
import { base64url } from 'multiformats/bases/base64';
import secp256k1 from 'noise-curve-secp';

describe('Slashtags Auth', () => {
  it('demo', () => {
    // Create a responder to manage sessions
    const responderKeypair = secp256k1.generateKeyPair();
    const responder = createResponder({
      keypair: responderKeypair,
      metadata: Buffer.from(JSON.stringify({ description: 'responder' })),
    });
    // Create a new challenge with a timeout in miliseconds, and metadata (optional)
    const { challenge, responderPublicKey } = responder.newChallenge(100);

    // Pass the challenge to the initiator somehow
    const initiatorKeypair = secp256k1.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      responderPublicKey: responderPublicKey,
      challenge: challenge,
      initiatorMetadata: Buffer.from(JSON.stringify({ name: 'foo' })),
    });

    // Pass the attestation to the responder
    const {
      // Get the initiator metadata
      initiatorMetadata,
      // Prepare an attestation for bidirectional authentication
      responderAttestation,
    } = responder.verify(initiator.attestation);

    expect(initiatorMetadata).toEqual(
      Buffer.from(JSON.stringify({ name: 'foo' })),
    );

    // Finally pass the responder attestation to the initiator
    const responderPayload = initiator.verify(responderAttestation);

    expect(responderPayload).toEqual({
      responderMetadata: '{"description":"responder"}',
      publicKey: base64url.encode(responderKeypair.publicKey),
    });

    expect(
      // @ts-ignore
      Buffer.from(base64url.decode(responderPayload.publicKey)),
    ).toEqual(responderKeypair.publicKey);
  });
});
