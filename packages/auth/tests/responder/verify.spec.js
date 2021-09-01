import {
  addSession,
  generateChallenge,
  _verify,
} from '../../src/responder/index';
import secp256k1 from 'noise-curve-secp';
import Noise from 'noise-handshake';
import secp from 'noise-handshake/dh';

describe('Slashtags Auth: Responder: Session: _verify()', () => {
  it('should verify an attestation to a challenge', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    addSession({ sessions, timeout: 10, challenge: challenge });

    const responderKeyPair = secp256k1.generateKeyPair();
    const handshake = new Noise('IK', true, responderKeyPair, {
      curve: secp256k1,
    });
    handshake.initialise(Buffer.alloc(0), responderKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');
    const attestation = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    const result = _verify({
      keypair: responderKeyPair,
      attestation,
      sessions,
      curve: secp256k1,
    });

    expect(result.responderAttestation).toBeInstanceOf(Buffer);
    expect(result.initiatorMetadata).toEqual(initiatorMetadata);
  });

  it('should verify an attestation with custom curve', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    addSession({ sessions, timeout: 10, challenge: challenge });

    const initiatorKeyPair = secp.generateKeyPair();
    const responderKeyPair = secp.generateKeyPair();

    const handshake = new Noise('IK', true, initiatorKeyPair, { curve: secp });
    handshake.initialise(Buffer.alloc(0), responderKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');

    const attestation = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    const result = _verify({
      keypair: responderKeyPair,
      attestation,
      sessions,
      curve: secp,
    });

    expect(result.responderAttestation).toBeInstanceOf(Buffer);
    expect(result.initiatorMetadata).toEqual(initiatorMetadata);
  });

  it('should throw an error if the session is not found', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    const responderKeyPair = secp256k1.generateKeyPair();
    const handshake = new Noise('IK', true, responderKeyPair, {
      curve: secp256k1,
    });
    handshake.initialise(Buffer.alloc(0), responderKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');
    const attestation = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    try {
      _verify({
        keypair: responderKeyPair,
        attestation,
        sessions,
        curve: secp256k1,
      });
    } catch (error) {
      expect(error.message).toEqual(
        `Challenge ${challenge.toString('hex')} not found`,
      );
    }
  });
});
