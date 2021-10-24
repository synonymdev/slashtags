import WebSocket from 'isomorphic-ws';

/**
 *
 * @param {JsonRpcEngine} engine
 * @param {ServerOptions} [opts]
 * @returns {Promise<Server>}
 */
export const WebsocketTransport = async (engine, opts) => {
  const wss = new WebSocket.Server(opts);

  wss.on('connection', function (socket) {
    socket.on(
      'message',
      /** @param {string} message */
      (message) => {
        try {
          const parsed = JSON.parse(message);

          engine.handle(parsed, (error, response) => {
            if (response) socket.send(JSON.stringify(response));
          });
        } catch (error) {
          socket.send(
            JSON.stringify({
              id: undefined,
              jsonrpc: '2.0',
              error,
            }),
          );
        }
      },
    );
  });

  return wss;
};

/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
/** @typedef {import ('ws').ServerOptions} ServerOptions */
/** @typedef {import ('../../../interfaces').Server} Server */
