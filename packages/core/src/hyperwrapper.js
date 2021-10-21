import _debug from 'debug';
import memoizer from 'lru-memoizer';
import { hexString } from './utils.js';

const debug = _debug('hyper');

/**
 * Create a request/response interface around hypercore feeds.
 * @param {object} opts
 * @param {SDKInstance} opts.sdk
 * @param {SDKInstance['keyPair']} [opts.keyPair]
 * @param {object} [opts.metadata]
 */
export const HyperWrapper = ({ keyPair, metadata, sdk }) => {
  /**
   *
   * @param {object} opts
   * @param {string | Buffer} opts.key
   * @param {boolean} opts.announce
   * @param {boolean} opts.lookup
   * @returns
   */
  const getFeed = ({ key, announce, lookup }) => {
    debug('getFeed', key, announce, lookup);
    return sdk.Hypercore(key, {
      valueEncoding: 'json',
      announce,
      lookup,
    });
  };

  /**
   * Get a connection
   * @param {object} opts
   * @param {string | Buffer} opts.key
   * @returns {Promise<PeerConnection>}
   */
  const _connect = async ({ key }) => {
    const feed = getFeed({ key, announce: false, lookup: true });
    debug('got feed?', feed);

    const ext = feed.registerExtension('slashtags', {
      encoding: 'json',
      onmessage: (msg, peer) => {
        debug.call('got', msg, hexString(peer.remotePublicKey));
      },
      onerror: () => {},
    });

    // Assume that the swarm is fully connected and only the server is announcing
    // TODO: Add a timeout, if the server is not reachable.
    return new Promise((resolve, reject) => {
      feed.on('peer-open', (peer) => {
        debug('got server?', hexString(peer.remotePublicKey), hexString(key));
        if (hexString(peer.remotePublicKey) === hexString(key)) {
          resolve({
            ...peer,
            /** @param {Buffer} msg */
            send: (msg) => {
              ext.send(msg, peer);
            },
          });
        }
      });
    });
  };

  const connect = memoizer.sync({
    load: (opts) => _connect(opts),
    hash: (opts) => (opts?.key ? hexString(opts?.key) : '__SelfFeed__'),
    itemMaxAge: () => 1000 * 60 * 100,
  });

  /**
   *
   * @param {object} opts
   * @param {keyOrName} opts.dest
   * @param {object} opts.message
   */
  const request = async ({ dest, message }) => {
    const connection = await connect({ key: dest });
    connection.send({ dest, message });
  };

  return {
    request,
    listen,
  };
};

/** @typedef {import ('./interfaces').SDKInstance} SDKInstance */
/** @typedef {import ('./interfaces').PeerConnection} PeerConnection */
/** @typedef {import('./interfaces').keyOrName} keyOrName */
