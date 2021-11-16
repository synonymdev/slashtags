/**
 * Convert a her string or a Buffer to a hex string.
 * @param {Buffer | string} pubKey
 * @returns {string}
 */
export const hexString = (pubKey) =>
  typeof pubKey === 'string' ? pubKey : pubKey?.toString('hex')
