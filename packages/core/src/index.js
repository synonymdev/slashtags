import * as rpc from './rpc/index.js';

/**
 * Create a new instance of Slashtags node.
 * @param {object} opts
 * @param {KeyPair} opts.keyPair - secp256k1 keypair (not the feed keypair)
 * @param {object} [opts.metadata]
 * @returns {Promise<{listen: (opts?: any) => Promise<Hypercore>, request: () => void}>}
 */
export const Core = async (opts) => {
  const server = await new rpc.Server(
    {
      foo: function (args, context, callback) {
        callback(null, context.headers);
      },
    },
    {
      useContext: true,
    },
  );

  return {
    listen: async (override) =>
      await server.hypercore({ ...opts, ...override }),
    request: () => {},
  };
};

/** @typedef {import ('./interfaces').Peer } Peer */
/** @typedef {import ('./interfaces').SDKInstance } SDKInstance */
/** @typedef {import ('./interfaces').Extension<any> } Extension */
/** @typedef {import ('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Hypercore<Buffer>} Hypercore */
