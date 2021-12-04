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
    return server.address().publicKey
  }

  /** @type {SlashtagsRPC['_openSockets']} */
  const _openSockets = new Map()

  /**
   *
   * @param {Buffer} destination
   */
  const setupNoiseSocket = async (destination) => {
    const noiseSocket = node.connect(destination)
    _openSockets.set(destination.toString('hex'), noiseSocket)

    let timeout = setTimeout(() => noiseSocket.destroy(), TIMEOUT)

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => noiseSocket.destroy(), TIMEOUT)
    }

    /** @param {string} message */
    jrpc.toStream = (message) => {
      resetTimeout()
      noiseSocket.write(message)
    }

    noiseSocket.on(
      'data',
      /** @param {Buffer | Uint8Array} data */
      (data) => {
        resetTimeout()
        jrpc.messageHandler(bint.toString(data, 'utf-8'))
      }
    )
  }

  /**
   *
   * @type {SlashtagsRPC['request']}
   */
  const _request = async (destination, method, params) => {
    const noiseSocket = _openSockets.get(destination.toString('hex'))

    if (!noiseSocket || noiseSocket.destroyed) {
      await setupNoiseSocket(destination)
    }

    return new Promise((resolve, reject) =>
      jrpc
        .call(method, params)
        .then((result) => resolve(result))
        .catch((error) => resolve(error))
    )
  }

  return {
    destroy: async () => node.destroy(),
    use: (method, params, callback) => jrpc.on(method, params, callback),
    listen: () => _listen(),
    request: (destination, method, params) =>
      _request(destination, method, params),
    _openSockets
  }
}

/** @typedef {import ('./interfaces').SlashtagsRPC} SlashtagsRPC */
