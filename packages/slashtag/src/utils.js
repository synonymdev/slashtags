import b4a from 'b4a'

/**
 *
 * @param {import('hyperswarm')} swarm
 * @param {Uint8Array} publicKey
 * @returns {Promise<{connection: SecretStream, peerInfo:PeerInfo}>}
 */
export function catchConnection (swarm, publicKey) {
  return new Promise((resolve) => {
    swarm?.on('connection', listener)

    /**
     * @param {SecretStream} connection
     * @param {PeerInfo} peerInfo
     */
    function listener (connection, peerInfo) {
      if (b4a.equals(peerInfo.publicKey, publicKey)) {
        swarm?.removeListener('connection', listener)
        resolve({ connection, peerInfo })
      }
    }
  })
}

/**
 * Simplified implementation of Fletcher16 checksum for small data that
 * does not need to be chunked.
 * See https://en.wikipedia.org/wiki/Fletcher%27s_checksum
 * @param {Uint8Array} buf
 * @returns
 */
export const fletcher16 = (buf) => {
  let sum1 = 0
  let sum2 = 0

  for (const n of buf) {
    sum1 = sum1 + n
    sum2 = sum2 + sum1
  }

  sum1 = sum1 % 255
  sum2 = sum2 % 255

  return new Uint8Array([sum2, sum1])
}

/**
 * @typedef {import('./interfaces').PeerInfo } PeerInfo
 * @typedef {import('./interfaces').SecretStream } SecretStream
 */
