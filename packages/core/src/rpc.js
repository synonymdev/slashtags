import JsonRPC from 'simple-jsonrpc-js'
import { DHT } from './dht.js'
import bint from 'bint8array'

// Close websockets if they are not used for 2 minutes
const TIMEOUT = 2 * 60 * 1000

/**
 *
 * @returns {Promise<SlashtagsRPC>}
 */
export const RPC = async () => {
  const jrpc = new JsonRPC()
  const node = await DHT()

  const server = node.createServer((noiseSocket) => {
    jrpc.toStream = (message) => noiseSocket.write(message)

    // @ts-ignore
    noiseSocket.jrpc = jrpc

    noiseSocket.on(
      'data',
      /** @param {Buffer | Uint8Array} data */
      (data) => jrpc.messageHandler(bint.toString(data, 'utf-8'))
    )
  })

  /**
   *
   * @type {SlashtagsRPC['listen']}
   */
  const _listen = async () => {
    await server.listen()
    return server._keyPair.publicKey
  }

  /** @type {SlashtagsRPC['_openSockets']} */
  const _openSockets = new Map()

  /**
   *
   * @type {SlashtagsRPC['request']}
   */
  const _request = (destination, method, params) => {
    const noiseSocket = _openSockets.get(destination.toString('hex'))

    if (!noiseSocket || noiseSocket.destroyed) {
      const noiseSocket = node.connect(destination)
      _openSockets.set(destination.toString('hex'), noiseSocket)

      /** @param {string} message */
      jrpc.toStream = (message) => noiseSocket.write(message)

      let timeout = setTimeout(() => noiseSocket.destroy(), TIMEOUT)

      noiseSocket.on(
        'data',
        /** @param {Buffer | Uint8Array} data */
        (data) => {
          clearTimeout(timeout)
          timeout = setTimeout(() => noiseSocket.destroy(), TIMEOUT)

          jrpc.messageHandler(bint.toString(data, 'utf-8'))
        }
      )

      return new Promise((resolve, reject) => {
        jrpc
          .call(method, params)
          .then((result) => resolve(result))
          .catch((error) => resolve(error))
      })
    }

    return new Promise((resolve, reject) => {
      jrpc
        .call(method, params)
        .then((result) => resolve(result))
        .catch((error) => resolve(error))
    })
  }

  return {
    use: (method, params, callback) => jrpc.on(method, params, callback),
    listen: () => _listen(),
    request: (destination, method, params) =>
      _request(destination, method, params),
    _openSockets
  }
}

/** @typedef {import ('./interfaces').SlashtagsRPC} SlashtagsRPC */
