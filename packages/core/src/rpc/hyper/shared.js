import { hexString } from '../../utils.js';
import SDK from 'hyper-sdk';

export const EXTENSION = 'slashtags';

/**
 * Get a Hypercore instance
 * @param {object} opts
 * @param {KeyPair} opts.keyPair
 * @param {boolean} opts.announce
 * @param {boolean} opts.lookup
 * @returns
 */
export const getFeed = async ({ keyPair, announce, lookup }) => {
  /** @type {SDKInstance} */
  const sdk = await SDK({
    persist: false,
    // Keep the default Feed static between sessions
    corestoreOpts: { masterKey: keyPair.secretKey },
  });

  // Hypercore key will different from the keyPair.publicKey (secp256k1)
  return sdk.Hypercore(hexString(keyPair.publicKey), {
    announce,
    lookup,
  });
};

/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import('../../interfaces').SDKInstance} SDKInstance */
