import b4a from 'b4a';

/**
 *
 * @param {import('hyperswarm')} swarm
 * @param {Uint8Array} publicKey
 * @returns {Promise<{connection: SecretStream, peerInfo:PeerInfo}>}
 */
export function catchConnection(swarm, publicKey) {
  return new Promise((resolve) => {
    swarm?.on('connection', listener);

    /**
     * @param {SecretStream} connection
     * @param {PeerInfo} peerInfo
     */
    function listener(connection, peerInfo) {
      if (b4a.equals(peerInfo.publicKey, publicKey)) {
        swarm?.removeListener('connection', listener);
        resolve({ connection, peerInfo });
      }
    }
  });
}

/**
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */
