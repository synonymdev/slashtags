import _debug from 'debug';
import SDK from 'hyper-sdk';
import { utils } from 'jayson';
import { hexString } from '../../utils';

const debug = _debug('hyper');

/**
 * Get a Hypercore instance
 * @param {object} opts
 * @param {Buffer} opts.key
 * @param {boolean} opts.announce
 * @param {boolean} opts.lookup
 * @returns
 */
const getFeed = async ({ key, announce, lookup }) => {
  debug('getFeed', key, announce, lookup);

  /** @type {SDKInstance} */
  const sdk = await SDK({
    persist: false,
    // Keep the default Feed static between sessions
    corestoreOpts: { masterKey: key },
  });

  return sdk.Hypercore(hexString(key), {
    announce,
    lookup,
  });
};

/**
 *  Constructor for a Jayson Hypercore Server
 *  @name ServerHypercore
 *  @param {Server} server Server instance
 *  @param {Object} options Options for this instance
 *  @param {SDKInstance} [options.sdk]
 *  @param {KeyPair} options.keyPair
 *  @return {Promise<Hypercore>}
 */
export const ServerHypercore = async function (server, options) {
  const feed = await getFeed({
    key: options.keyPair.publicKey,
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
    const response = utils.response(error, undefined, undefined, 2);

    //@ts-ignore
    extension.send(response, peer);
  }

  return feed;
};

/** @typedef {import('jayson').Server} Server */
/** @typedef {import('../../interfaces').SDKInstance} SDKInstance */
/** @typedef {import('../../interfaces').Hypercore<Buffer>} Hypercore */
/** @typedef {import ('../../interfaces').KeyPair} KeyPair */
/** @typedef {import ('../../interfaces').PeerConnection} PeerConnection */
/** @typedef {import ('jayson').JSONRPCRequestLike} JSONRPCRequestLike*/
