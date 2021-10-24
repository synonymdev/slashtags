import { WebsocketTransport } from './transports/websocket.js';

/**
 *
 * @param {JsonRpcEngine} engine
 * @param {SocketOptions} [opts]
 * @returns {Promise<Server>}
 */
export const listen = (engine, opts) => {
  return WebsocketTransport(engine, opts);
};

/** @typedef {import('../../interfaces').SocketOptions} SocketOptions */
/** @typedef {import('../../interfaces').Server} Server */
/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
