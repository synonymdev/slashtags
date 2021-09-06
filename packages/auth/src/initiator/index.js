import { createHandshake, decodeChallenge } from '../utils/index.js';
import { DEFAULT_CURVE, PROLOGUE } from '../constants.js';

/**
 * Create a new initiator that will respond to a challenge and confirm responder's identity
 * @param {object} config
 * @param {KeyPair} config.keypair
 * @param {Buffer} config.responderPublicKey
 * @param {Buffer} config.challenge
 * @param {Curve | Curve[]} [config.curve]
 * @param {object} [config.initiatorMetadata]
 */
export const createInitiatior = ({
  keypair,
  responderPublicKey,
  challenge,
  curve,
  initiatorMetadata,
}) => {
  const decoded = decodeChallenge(challenge);

  curve = curve || DEFAULT_CURVE;
  if (Array.isArray(curve)) {
    curve = curve.find((c) => c.ALG === decoded.curveName);
  } else if (curve?.ALG) {
    curve = curve.ALG === decoded.curveName ? curve : undefined;
  }

  if (!curve && decoded.curveName !== 'Ed25519') {
    throw new Error('No suitable curve provided for: ' + decoded.curveName);
  }

  const handshake = createHandshake('IK', true, keypair, {
    curve: curve || DEFAULT_CURVE,
  });
  handshake.initialise(PROLOGUE, responderPublicKey);

  const attestation = Buffer.from(
    handshake.send(
      Buffer.concat([
        decoded.challenge,
        initiatorMetadata
          ? Buffer.from(JSON.stringify(initiatorMetadata))
          : Buffer.alloc(0),
      ]),
    ),
  );

  /**
   * @param {Buffer} responderAttestation
   * @returns {{
   *  responderPublicKey: string,
   *  responderMetadata?: Object
   * }}
   */
  const verify = (responderAttestation) => {
    const result = JSON.parse(handshake.recv(responderAttestation).toString());
    try {
      result.responderMetadata = JSON.parse(result.responderMetadata);
    } catch (error) {
      delete result.responderMetadata;
    }

    return result;
  };

  return {
    /** Initiator's attestation to the challenge */
    attestation,
    /**  Verify responder's attestation and get the payload including metdata */
    verify,
  };
};

/** @typedef {import("../interfaces").KeyPair} KeyPair */
/** @typedef {import("../interfaces").Curve} Curve */
