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
