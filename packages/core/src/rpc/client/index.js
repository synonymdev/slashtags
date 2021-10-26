import SimpleJsonrpc from 'simple-jsonrpc-js'
import Websocket from 'isomorphic-ws'
import LRU from 'lru'

const websocketCache = new LRU(3)
websocketCache.on('evict', (data) => data.value.ws.close())

// Close websockets if they are not used for 6 seconds
const TIMEOUT = 6000

/**
 *
 * @param {string} address
 * @param {string} method
 * @param {JSON} params
 * @returns
 */
export const request = (address, method, params) => {
  /** @type {import('isomorphic-ws')} */
  const ws = websocketCache.get(address)?.ws

  if (ws && ws.readyState === 1) {
    const { jrpc } = websocketCache.get(address)
    return new Promise((resolve, reject) => {
      jrpc
        .call(method, params)
        // @ts-ignore
        .then((result) => resolve(result))
        // @ts-ignore
        .catch((error) => resolve(error))
    })
  } else {
    const ws = new Websocket(address)
    const jrpc = new SimpleJsonrpc()

    /** @param {string} _msg */
    jrpc.toStream = (_msg) => ws.send(_msg)

    return new Promise((resolve, reject) => {
      ws.onopen = ({ target }) => {
        websocketCache.set(address, { ws: target, jrpc })

        let timeout = setTimeout(() => target.close(), TIMEOUT)

        ws.onmessage = ({ data, target }) => {
          clearTimeout(timeout)

          timeout = setTimeout(() => target.close(), TIMEOUT)

          jrpc.messageHandler(data)
        }

        jrpc
          .call(method, params)
          .then((result) => resolve(result))
          .catch((error) => resolve(error))
      }
    })
  }
}

/** @typedef {import ('json-rpc-engine').JsonRpcRequest<JSON>} JsonRpcRequest */
/** @typedef {import('../../interfaces').JSON} JSON */
