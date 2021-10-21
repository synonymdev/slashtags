import _debug from 'debug';
import SDK from 'hyper-sdk';
import jayson from 'jayson';
import { hexString } from '../../utils.js';

const debug = _debug('hyper');

/**
 * Get a Hypercore instance
 * @param {object} opts
 * @param {KeyPair} opts.keyPair
 * @param {boolean} opts.announce
 * @param {boolean} opts.lookup
 * @returns
 */
const getFeed = async ({ keyPair, announce, lookup }) => {
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

/**
 *  Constructor for a Jayson Hypercore Server
 *  @name ServerHypercore
 *  @param {Server} server Server instance
 *  @param {Object} options Options for this instance
 *  @param {KeyPair} options.keyPair
 *  @return {Promise<Hypercore>}
 */
export const ServerHypercore = async function (server, options) {
  const feed = await getFeed({
    keyPair: options.keyPair,
    announce: true,
    lookup: true,
  });

  const extension = feed.registerExtension('slashtags', {
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
/** @typedef {import('../../interfaces').SDKInstance} SDKInstance */
/** @typedef {import('../../interfaces').Hypercore<Buffer>} Hypercore */
/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').PeerConnection} PeerConnection */
/** @typedef {import ('jayson').JSONRPCRequestLike} JSONRPCRequestLike*/
