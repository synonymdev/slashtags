import * as rpc from './rpc/hyper/index.js';

/**
 * Create a new instance of Slashtags node.
 * @param {object} opts
 * @param {KeyPair} opts.keyPair - secp256k1 keypair (not the feed keypair)
 * @param {{[key:string]:MethodLike}} [opts.methods] - server methods
 * @param {ServerOptions} [opts.serverOptions] - server options
 */
export const Core = async (opts) => {
  const server = new rpc.Server(opts?.methods, opts?.serverOptions);

  const client = rpc.Client();

  return {
    /**
     * Listen for incoming requests.
     * @returns {Promise<Hypercore>}
     */
    // @ts-ignore
    listen: async () => server.hypercore(opts),
    request: async (destination, methodName, params) =>
      client.request(method, params),
  };
};

/** @typedef {import ('./interfaces').Peer } Peer */
/** @typedef {import ('./interfaces').SDKInstance } SDKInstance */
/** @typedef {import ('./interfaces').Extension<any> } Extension */
/** @typedef {import ('./interfaces').KeyPair} KeyPair */
/** @typedef {import('./interfaces').Hypercore<Buffer>} Hypercore */
/** @typedef {import('jayson').MethodLike} MethodLike */
/** @typedef {import('jayson').ServerOptions} ServerOptions */
