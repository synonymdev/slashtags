import { WebsocketTransport } from './transports/websocket.js'

/**
 *
 * @param {JsonRpcEngine} engine
 * @param {Server | ServerOptions} server
 * @returns {Promise<Server>}
 */
export const listen = (engine, server) => {
  return WebsocketTransport(engine, server)
}

/** @typedef {import('../../interfaces').ServerOptions} ServerOptions */
/** @typedef {import('../../interfaces').Server} Server */
/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
