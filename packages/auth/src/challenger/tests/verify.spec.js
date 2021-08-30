import { addSession, generateChallenge, _verify } from '../index';
import secp256k1 from 'noise-curve-secp';
import Noise from 'noise-handshake';
import secp from 'noise-handshake/dh';

const challengerKeyPair = secp256k1.generateKeyPair();

describe('Slashtags Auth: Challenger: Session: _verify()', () => {
  it('should verify a response to a challenge', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    addSession({ sessions, timeout: 10, challenge: challenge });

    const responderKeyPair = secp256k1.generateKeyPair();
    const handshake = new Noise('IK', true, responderKeyPair, {
      curve: secp256k1,
    });
    handshake.initialise(Buffer.alloc(0), challengerKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');
    const response = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    const result = _verify({
      keypair: challengerKeyPair,
      response,
      sessions,
      curve: secp256k1,
    });

    expect(result.challengerResponse).toBeInstanceOf(Buffer);
    expect(result.initiatorMetadata).toEqual(initiatorMetadata);
  });

  it('should verify a response with custom curve', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    addSession({ sessions, timeout: 10, challenge: challenge });

    const responderKeyPair = secp.generateKeyPair();
    const challengerKeyPair = secp.generateKeyPair();

    const handshake = new Noise('IK', true, responderKeyPair, { curve: secp });
    handshake.initialise(Buffer.alloc(0), challengerKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');

    const response = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    const result = _verify({
      keypair: challengerKeyPair,
      response,
      sessions,
      curve: secp,
    });

    expect(result.challengerResponse).toBeInstanceOf(Buffer);
    expect(result.initiatorMetadata).toEqual(initiatorMetadata);
  });

  it('should throw an error if the session is not found', () => {
    const sessions = new Map();
    const challenge = generateChallenge();

    const responderKeyPair = secp256k1.generateKeyPair();
    const handshake = new Noise('IK', true, responderKeyPair, {
      curve: secp256k1,
    });
    handshake.initialise(Buffer.alloc(0), challengerKeyPair.publicKey);

    const initiatorMetadata = Buffer.from('initiator');
    const response = Buffer.from(
      handshake.send(Buffer.concat([challenge, initiatorMetadata])),
    );

    try {
      _verify({
        keypair: challengerKeyPair,
        response,
        sessions,
        curve: secp256k1,
      });
    } catch (error) {
      expect(error.message).toEqual(
        `Session ${challenge.toString('hex')} not found`,
      );
    }
  });
});
