import SimpleJsonrpc from 'simple-jsonrpc-js'
import Websocket from 'isomorphic-ws'
import LRU from 'lru'

// Close websockets if are not used for more than 60 seconds
const websocketCache = new LRU({ maxAge: 10 * 60 })
websocketCache.on('evict', (data) => data.value.close())

/**
 *
 * @param {string} address
 * @param {string} method
 * @param {JSON} params
 * @returns
 */
export const request = (address, method, params) => {
  /** @type {import('isomorphic-ws')} */
  let ws

  if (websocketCache.peek(address)) {
    ws = websocketCache.get(address)
    console.log('reusing websocket', address, websocketCache.length)
  } else {
    ws = new Websocket(address)
    websocketCache.set(address, ws)
    console.log('new websocket', address, websocketCache.length)
  }

  const jrpc = new SimpleJsonrpc()

  /** @param {string} _msg */
  jrpc.toStream = (_msg) => ws.send(_msg)

  ws.onmessage = (event) => jrpc.messageHandler(event.data)

  return new Promise((resolve, reject) => {
    ws.onopen = function open () {
      jrpc
        .call(method, params)
        // @ts-ignore
        .then((result) => resolve(result))
        // @ts-ignore
        .catch((error) => resolve(error))
    }
  })
}

/** @typedef {import ('json-rpc-engine').JsonRpcRequest<JSON>} JsonRpcRequest */
/** @typedef {import('../../interfaces').JSON} JSON */
