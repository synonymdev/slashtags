import _debug from 'debug';
import jayson from 'jayson';
import { hexString, feedKey } from '../../utils.js';
import { EXTENSION, getFeed } from './shared.js';

const debug = _debug('hyper');

/**
 *  Constructor for a Jayson Hypercore Server
 *  @name ServerHypercore
 *  @param {Server} server Server instance
 *  @param {Object} options Options for this instance
 *  @param {Buffer | string} [options.key]
 *  @param {KeyPair} options.keyPair
 *  @return {Promise<Hypercore>}
 */
export const ServerHypercore = async function (server, options) {
  // Make sure to use a valid ed25519 publickey
  const feed = await getFeed({
    key: options.key || feedKey(options.keyPair.publicKey),
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
   * @param {JSON} message
   * @param {PeerConnection} peer
   */
  function onMessage(message, peer) {
    // every message received on a connection socket is handled as a JSON-RPC message
    debug('got', message, hexString(peer.remotePublicKey));

    //@ts-ignore
    server.call(message, function (error, success) {
      if (error) return respondError(error, peer);
      if (success) extension.send(success, peer);
    });
  }

  // writes an error message to the client
  /**
   * @param {Error} err
   * @param {PeerConnection} peer
   */
  function respondError(err, peer) {
    const error = server.error(-32700, err.message);
    const response = jayson.utils.response(error, undefined, undefined, 2);

    //@ts-ignore
    extension.send(response, peer);
  }

  debug('Listening on feed', hexString(feed.key));
  return feed;
};

/** @typedef {import('jayson').Server} Server */
/** @typedef {import('../../interfaces').Hypercore<Buffer>} Hypercore */
/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').PeerConnection} PeerConnection */
/** @typedef {import ('jayson').JSONRPCRequestLike} JSONRPCRequestLike*/
