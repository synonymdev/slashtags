import Noise from 'noise-handshake';
import { decodeChallenge } from '../utils/index.js';
import secp256k1 from 'noise-curve-secp';

const PROLOGUE = Buffer.alloc(0);

/**
 * Create a new initiator that will respond to a challenge and confirm responder's identity
 * @param {object} config
 * @param {KeyPair} config.keypair
 * @param {Buffer} config.responderPublicKey
 * @param {Buffer} config.challenge
 * @param {SlashtagsAuthCurve | SlashtagsAuthCurve[]} [config.curve]
 * @param {Buffer} [config.initiatorMetadata]
 */
export const createInitiatior = ({
  keypair,
  responderPublicKey,
  challenge,
  curve,
  initiatorMetadata = Buffer.alloc(0),
}) => {
  const decoded = decodeChallenge(challenge);

  curve = curve || secp256k1;
  if (Array.isArray(curve)) {
    curve = curve.find((c) => c.ALG === decoded.curveName);
  } else if (curve?.ALG) {
    curve = curve.ALG === decoded.curveName ? curve : undefined;
  }

  if (!curve && decoded.curveName !== 'Ed25519') {
    throw new Error('No suitable curve provided for: ' + decoded.curveName);
  }

  const handshake = new Noise('IK', true, keypair, { curve });
  handshake.initialise(PROLOGUE, responderPublicKey);

  const attestation = Buffer.from(
    handshake.send(Buffer.concat([decoded.challenge, initiatorMetadata])),
  );

  /**
   * @param {Buffer} responderAttestation
   * @returns {Serializable}
   */
  const verify = (responderAttestation) =>
    JSON.parse(handshake.recv(responderAttestation));

  return {
    /** Initiator's attestation to the challenge */
    attestation,
    /**  Verify responder's attestation and get the payload including metdata */
    verify,
  };
};
