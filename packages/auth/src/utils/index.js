import Noise from 'noise-handshake';

/**
 * Encode a challenge and its curve alg name to a buffer.
 * @param {string} curveName
 * @param {Buffer} challenge
 * @returns  {Buffer}
 */
export const encodeChallenge = (curveName, challenge) =>
  Buffer.from(JSON.stringify([curveName, challenge]));

/**
 * Decode a challenge and its curve alg name from a buffer.
 * @param {Buffer} buffer
 * @returns  {{curveName: string, challenge: Buffer}}
 */
export const decodeChallenge = (buffer) => {
  const parsed = JSON.parse(buffer.toString());
  return {
    curveName: parsed[0],
    challenge: Buffer.from(parsed[1]),
  };
};

/**
 *
 * @param {string} pattern
 * @param {boolean} initiator
 * @param {KeyPair} staticKeypair
 * @param {{curve: Curve}} opts
 * @returns {Noise}
 */
export const createHandshake = (pattern, initiator, staticKeypair, opts) => {
  // @ts-ignore
  return new Noise(pattern, initiator, staticKeypair, opts);
};

/** @typedef {import('../interfaces').KeyPair} KeyPair */
/** @typedef {import('../interfaces').Curve} Curve */
/** @typedef {import('../interfaces').Noise} Noise */
