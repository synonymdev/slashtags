import SimpleJsonrpc from 'simple-jsonrpc-js'
import Websocket from 'isomorphic-ws'
import LRU from 'lru'

// Close websockets if are not used for more than 60 seconds
const websocketCache = new LRU({ maxAge: 10 * 60 })
websocketCache.on('evict', (data) => data.value.ws.close())

/**
 *
 * @param {string} address
 * @param {string} method
 * @param {JSON} params
 * @returns
 */
export const request = (address, method, params) => {
  /** @type {import('isomorphic-ws')} */
  if (websocketCache.peek(address)) {
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

    ws.onmessage = (event) => jrpc.messageHandler(event.data)

    return new Promise((resolve, reject) => {
      ws.onopen = ({ target }) => {
        websocketCache.set(address, { ws: target, jrpc })

        jrpc
          .call(method, params)
          // @ts-ignore
          .then((result) => resolve(result))
          // @ts-ignore
          .catch((error) => resolve(error))
      }
    })
  }
}

/** @typedef {import ('json-rpc-engine').JsonRpcRequest<JSON>} JsonRpcRequest */
/** @typedef {import('../../interfaces').JSON} JSON */
