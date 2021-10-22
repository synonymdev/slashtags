import SDK from 'hyper-sdk';
import { hexString } from '../../utils.js';

export const EXTENSION = 'slashtags';

/**
 * Get a Hypercore instance
 * @param {object} opts
 * @param {keyOrName} opts.key
 * @param {boolean} opts.server
 * @param {boolean} opts.client
 * @returns {Promise<Hypercore>}
 */
export const getFeed = async ({ key, server, client }) => {
  /** @type {SDKInstance} */
  const sdk = await SDK({ persist: false });

  // Hypercore key will different from the keyPair.publicKey (secp256k1)
  return sdk.Hypercore(hexString(key), {
    announce: server,
    lookup: client,
  });
};

/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').keyOrName} keyOrName */
/** @typedef {import ('../../interfaces').Hypercore} Hypercore */
/** @typedef {import('../../interfaces').SDKInstance} SDKInstance */
