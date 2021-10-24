var WebSocketServer = new require('ws');
var JsonRPC = require('simple-jsonrpc-js');

exports.RPC = () => {
  const socket = new WebSocketServer.Server({
    host: '0.0.0.0',
    port: 8080,
  });

  const jrpc = new JsonRPC();

  socket.on('connection', function (ws) {
    ws.jrpc = jrpc;

    ws.jrpc.toStream = function (message) {
      ws.send(message);
    };

    ws.on('message', function (message) {
      jrpc.messageHandler(message);
    });
  });

  return jrpc;
};
