import { createInitiatior } from '../../src/initiator/index';
import secp256k1 from 'noise-curve-secp';
import { encodeChallenge } from '../../src/utils';
import { generateChallenge, createResponder } from '../../src/responder';
import { base64url } from 'multiformats/bases/base64';

describe('Slashtags Auth: Responder: createInitiatior()', () => {
  it('should throw an error if the curve is not available', () => {
    const challenge = generateChallenge();
    const encoded = encodeChallenge('not-available', challenge);
    const keypair = secp256k1.generateKeyPair();

    try {
      createInitiatior({
        keypair,
        responderPublicKey: Buffer.from(''),
        challenge: encoded,
      });
    } catch (error) {
      expect(error.message).toBe(
        'No suitable curve provided for: not-available',
      );
    }
  });

  it('should create an attestation to the challenge', () => {
    const responderKeypair = secp256k1.generateKeyPair();
    const responder = createResponder({ keypair: responderKeypair });
    const { challenge } = responder.newChallenge(30);

    const initiatorKeypair = secp256k1.generateKeyPair();
    const initiator = createInitiatior({
      keypair: initiatorKeypair,
      responderPublicKey: responderKeypair.publicKey,
      challenge: challenge,
    });

    expect(initiator.attestation).toBeInstanceOf(Buffer);

    const { responderAttestation } = responder.verify(initiator.attestation);

    const responderData = initiator.verify(responderAttestation);
    expect(responderData).toEqual({
      publicKey: base64url.encode(responderKeypair.publicKey),
    });
  });
});
