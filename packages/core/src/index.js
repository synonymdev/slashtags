import { HyperWrapper } from './hyperwrapper.js';

/**
 * Create a new instance of Slashtags node.
 * @param {object} [opts]
 * @param {KeyPair} [opts.keyPair] - secp256k1 keypair (not the feed keypair)
 * @param {object} [opts.metadata]
 * @returns
 */
export const Core = async (opts) => {
  const node = HyperWrapper({ ...opts, sdk: undefined });
  return node;
};

/** @typedef {import ('./interfaces').Peer } Peer */
/** @typedef {import ('./interfaces').SDKInstance } SDKInstance */
/** @typedef {import ('./interfaces').Extension<any> } Extension */
/** @typedef {import ('./interfaces').KeyPair} KeyPair */
