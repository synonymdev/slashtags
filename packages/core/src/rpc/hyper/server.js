import _debug from 'debug';
import { hexString } from '../../utils.js';
import { EXTENSION, getFeed } from './shared.js';

const debug = _debug('hyper');

/**
 *  Constructor for a Jayson Hypercore Server
 *  @name ServerHypercore
 *  @param {JsonRpcEngine} engine Options for this instance
 *  @param {Object} options Options for this instance
 *  @param {Buffer | string} [options.key]
 *  @param {KeyPair} options.keyPair
 *  @return {Promise<Hypercore>}
 */
export const ServerHypercore = async function (engine, options) {
  // Make sure to use a valid ed25519 publickey
  const feed = await getFeed({
    key: options.key,
    keyPair: options.keyPair,
    server: true,
    client: false,
  });

  const extension = feed.registerExtension(EXTENSION, {
    encoding: 'json',
    onmessage: onMessage,
    onerror: (err) => debug('error', err),
  });

  feed.on('peer-open', (peer) => {
    debug('peer-open', hexString(peer.remotePublicKey));
  });

  feed.on('close', () => debug('Closing feed', hexString(feed.key)));

  /**
   * @param {JsonRpcRequest} message
   * @param {PeerConnection} peer
   */
  function onMessage(message, peer) {
    debug('got', message, hexString(peer.remotePublicKey));

    engine.handle(message, (error, response) => {
      if (error) throw error;
      // @ts-ignore
      if (message.method) extension.send(response, peer);
    });
  }

  debug('Listening on feed', hexString(feed.key));

  await feed.ready();
  return feed;
};

/** @typedef {import('../../interfaces').Hypercore<Buffer>} Hypercore */
/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').PeerConnection} PeerConnection */
/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
/** @typedef {import ('json-rpc-engine').JsonRpcRequest<JSON>} JsonRpcRequest */
/** @typedef {import ('json-rpc-engine').JsonRpcResponse<JSON>} JsonRpcResponse */
