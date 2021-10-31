import { WebsocketTransport } from './transports/websocket.js'

/**
 *
 * @param {JsonRpcEngine} engine
 * @param {Server} server
 * @returns {Promise<Server>}
 */
export const listen = (engine, server) => {
  return WebsocketTransport(engine, server)
}

/** @typedef {import('../../interfaces').Server} Server */
/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
