import crypto from 'crypto';

/**
 * Convert a her string or a Buffer to a hex string.
 * @param {Buffer | string} pubKey
 * @returns {string}
 */
export const hexString = (pubKey) =>
  typeof pubKey === 'string' ? pubKey : pubKey?.toString('hex');

/**
 *
 * @param {Buffer | string} key
 * @returns {Buffer}
 */
export const feedKey = (key) => {
  const result = crypto.createHash('sha256').update(key).digest();

  return result;
};
