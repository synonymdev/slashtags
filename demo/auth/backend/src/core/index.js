const debug = require('debug')('Slashtags');
const memoizer = require('lru-memoizer');

// First, you'll want to load the SDK
const _SDK = require('hyper-sdk');
// Hack for types
const SDK = _SDK.default || _SDK;

const address = (pubKey) =>
  pubKey instanceof String ? pubKey : pubKey?.toString('hex');

/**
 * @param {object} opts
 * @param {SDKInstance} opts.sdk
 * @param {SDKInstance['keyPair']} [opts.keyPair]
 * @param {object} [opts.metadata]
 */
function Slashtags({ keyPair, metadata, sdk }) {
  const feeds = new Map();

  /**
   *
   * @param {object} opts
   * @param {string | Buffer} opts.key
   * @param {boolean} opts.announce
   * @param {boolean} opts.lookup
   * @memberof Slashtags
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
   * Before meomoization
   * @param {object} [opts]
   * @param {string | Buffer} [opts.key]
   * @returns
   */
  const _listen = ({ key } = {}) => {
    key = key || sdk.keyPair.publicKey;
    const feed = getFeed({ key, announce: true, lookup: false });

    const ext = feed.registerExtension('slashtags', {
      encoding: 'json',
      onmessage: (msg, peer) => {
        debug('got', msg, address(peer.remotePublicKey));
      },
      onerror: () => {},
    });

    return feed;
  };

  const memoized_listen = memoizer.sync({
    load: (opts) => _listen(opts),
    hash: (opts) => (opts?.key ? address(opts?.key) : '__SelfFeed__'),
    itemMaxAge: () => 1000 * 60 * 100,
  });

  /**
   *
   * @param {object} [opts]
   * @param {string | Buffer} [opts.key]
   * @returns
   */
  const listen = (opts) => memoized_listen(opts);

  /**
   *
   * @param {object} opts
   * @param {string | Buffer} opts.key
   * @returns {Promise<{send: (msg:Buffer)=>void,}>}
   */
  const connect = async ({ key }) => {
    const feed = getFeed({ key, announce: false, lookup: true });

    const ext = feed.registerExtension('slashtags', {
      encoding: 'json',
      onmessage: (msg, peer) => {
        debug('got', msg, address(peer.remotePublicKey));
      },
      onerror: () => {},
    });

    // Assume that the swarm is fully connected and only the server is announcing
    // TODO: Add a timeout, if the server is not reachable.
    return new Promise((resolve, reject) => {
      feed.on('peer-open', (peer) => {
        if (address(peer.remotePublicKey) === address(key)) {
          debug('Connected to server', address(peer.remotePublicKey));
          resolve({
            send: (msg) => {
              debug('Sending message to server', msg);
              ext.send(msg, peer);
            },
          });
        }
      });
    });
  };

  const request = async ({ dest, message }) => {
    (await connect({ key: dest })).send(message);
  };

  return {
    request,
    listen,
  };
}

/**
 * Create a new instance of Slashtags node.
 * @param {object} [opts]
 * @param {SDKInstance['keyPair']} [opts.keyPair]
 * @param {object} [opts.metadata]
 * @returns
 */
module.exports = async function Node(opts) {
  const sdk = await SDK({
    persist: false,
  });

  const node = Slashtags({ ...opts, sdk });
  return node;
};

/** @typedef {import ('hyper-sdk').Peer } Peer */
/** @typedef {import ('hyper-sdk').SDKInstance } SDKInstance */
/** @typedef {import ('hyper-sdk').Extension<any> } Extension */
