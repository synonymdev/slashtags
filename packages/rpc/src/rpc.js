import { DHT } from './dht.js'
import { Engine } from './engine.js'
import b4a from 'b4a'

// Close websockets if they are not used for 2 minutes
const TIMEOUT = 2 * 60 * 1000

/**
 * @param {object} [opts]
 * @param {string[]} [opts.relays]
 * @param {number} [opts.requestTimout]
 * @returns {Promise<SlashtagsRPC>}
 */
export const RPC = async (opts) => {
  const engine = await new Engine()
  const node = await DHT(opts)

  const server = node.createServer((noiseSocket) =>
    noiseSocket.on('data', (data) => engine.handleRaw(data, noiseSocket))
  )

  /**
   *
   * @type {SlashtagsRPC['listen']}
   */
  const _listen = async () => {
    try {
      await server.listen()
    } catch (error) {
      // Already listening
    }
    return server.address().publicKey
  }

  /** @type {SlashtagsRPC['_openSockets']} */
  const _openSockets = new Map()

  /**
   *
   * @param {Uint8Array} destination
   */
  const setupNoiseSocket = async (destination) => {
    const noiseSocket = node.connect(destination)
    const key = b4a.toString(destination, 'hex')

    const createTimeout = () =>
      setTimeout(() => {
        noiseSocket.destroy()
        _openSockets.delete(key)
      }, opts?.requestTimout || TIMEOUT)

    let timeout = createTimeout()

    const resetTimeout = () => {
      clearTimeout(timeout)
      timeout = createTimeout()
    }

    const openSocket = { noiseSocket, resetTimeout }
    _openSockets.set(key, openSocket)

    noiseSocket.on(
      'data',
      /** @param {Uint8Array} data */
      (data) => {
        resetTimeout()
        engine.handleResponse(data)
      }
    )

    return new Promise((resolve, reject) => {
      noiseSocket.on('open', () => resolve({ noiseSocket, resetTimeout }))
      noiseSocket.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   *
   * @type {SlashtagsRPC['request']}
   */
  const _request = async (destination, method, params) => {
    let openSocket = _openSockets.get(b4a.toString(destination, 'hex'))

    if (!openSocket || openSocket.noiseSocket.destroyed) {
      openSocket = await setupNoiseSocket(destination)
    }

    return engine.call(
      method,
      params,
      // @ts-ignore Error is thrown if openSocket is undefined
      openSocket.noiseSocket
    )
  }

  return {
    addMethods: (methods) => engine.addMethods(methods),
    listen: () => _listen(),
    request: (destination, method, params) =>
      _request(destination, method, params),
    _openSockets
  }
}

/** @typedef {import ('./interfaces').SlashtagsRPC} SlashtagsRPC */
/** @typedef {import ('./interfaces').NoiseSocket} NoiseSocket */
