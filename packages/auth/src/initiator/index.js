import Noise from 'noise-handshake';
import { decodeChallenge } from '../utils';
import secp256k1 from 'noise-curve-secp';

const PROLOGUE = Buffer.alloc(0);

/**
 *
 * @param {object} config
 * @param {KeyPair} config.keypair
 * @param {Buffer} config.challengerPublicKey
 * @param {Buffer} config.challenge
 * @param {SlashtagsAuthCurve | SlashtagsAuthCurve[]} [config.curve]
 * @param {Buffer} [config.initiatorMetadata]
 */
export const createInitiatior = ({
  keypair,
  challengerPublicKey,
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
  handshake.initialise(PROLOGUE, challengerPublicKey);

  const response = Buffer.from(
    handshake.send(Buffer.concat([decoded.challenge, initiatorMetadata])),
  );

  /**
   * @param {Buffer} challengerResponse
   * @returns {Serializable}
   */
  const verify = (challengerResponse) =>
    JSON.parse(handshake.recv(challengerResponse));

  return {
    /** Initiator's response to the challenge */
    response,
    /**  Verify challenger's response and get the payload including metdata */
    verify,
  };
};
