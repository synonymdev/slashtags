import {
  addSession,
  generateChallenge,
  _verify,
} from '../../src/responder/index.js';
import secp256k1 from 'noise-curve-secp';
import Noise from 'noise-handshake';
import secp from 'noise-handshake/dh.js';
import assert from 'assert';

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

    assert.equal(result.responderAttestation instanceof Buffer, true);
    assert.deepEqual(result.initiatorMetadata, initiatorMetadata);
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

    assert.equal(result.responderAttestation instanceof Buffer, true);
    assert.deepEqual(result.initiatorMetadata, initiatorMetadata);
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

    let error;
    try {
      _verify({
        keypair: responderKeyPair,
        attestation,
        sessions,
        curve: secp256k1,
      });
    } catch (err) {
      error = err;
    }
    assert.equal(
      error.message,
      `Challenge ${challenge.toString('hex')} not found`,
    );
  });
});
