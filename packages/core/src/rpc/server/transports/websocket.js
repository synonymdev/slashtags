import WebSocket from 'isomorphic-ws'

/**
 *
 * @param {JsonRpcEngine} engine
 * @param {ServerOptions | Server} server
 * @returns {Promise<Server>}
 */
export const WebsocketTransport = async (engine, server) => {
  const wss =
      server instanceof WebSocket.Server
        ? server
        : new WebSocket.Server(server)

  wss.on('connection', function (socket) {
    socket.on(
      'message',
      /** @param {string} message */
      (message) => {
        try {
          const parsed = JSON.parse(message)

          engine.handle(parsed, (error, response) => {
            if (response) socket.send(JSON.stringify(response))
            console.warn(error)
          })
        } catch (error) {
          socket.send(
            JSON.stringify({
              id: undefined,
              jsonrpc: '2.0',
              error
            })
          )
        }
      }
    )
  })

  return wss
}

/** @typedef {import ('json-rpc-engine').JsonRpcEngine} JsonRpcEngine */
/** @typedef {import ('ws').ServerOptions} ServerOptions */
/** @typedef {import ('isomorphic-ws').Server} Server */
