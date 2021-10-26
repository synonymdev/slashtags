import SimpleJsonrpc from 'simple-jsonrpc-js'
import Websocket from 'isomorphic-ws'

// Close websockets if they are not used for 6 seconds
const TIMEOUT = 6000

/**
 *
 * @param {string} address
 * @param {string} method
 * @param {JSON} params
 * @param {Map<string, {ws: Socket, jrpc: JRPC}>} openWebSockets
 * @returns
 */
export const request = (address, method, params, openWebSockets) => {
  const entry = openWebSockets.get(address)

  if (entry && entry?.ws.readyState === 1) {
    console.log('reusing exsiting websocket')
    const { jrpc } = entry
    return new Promise((resolve, reject) => {
      jrpc
        .call(method, params)
        // @ts-ignore
        .then((result) => resolve(result))
        // @ts-ignore
        .catch((error) => resolve(error))
    })
  } else {
    console.log('requesting from new websocket')
    const ws = new Websocket(address)
    const jrpc = new SimpleJsonrpc()

    /** @param {string} _msg */
    jrpc.toStream = (_msg) => ws.send(_msg)

    return new Promise((resolve, reject) => {
      ws.onopen = ({ target }) => {
        target.onclose = () => openWebSockets.delete(address)

        openWebSockets.set(address, { ws: target, jrpc })

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
/** @typedef {import ('simple-jsonrpc-js')} JRPC */
/** @typedef {import('../../interfaces').JSON} JSON */
/** @typedef {import('ws').WebSocket} Socket */
