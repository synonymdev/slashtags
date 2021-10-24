const websocket = require('isomorphic-ws');
var JsonRPC = require('simple-jsonrpc-js');

exports.RPC = () => {
  const ws = new websocket.Server({ port: 8080 });

  const jrpc = new JsonRPC();

  ws.on('connection', function (socket) {
    socket.jrpc = jrpc;

    socket.jrpc.toStream = function (message) {
      socket.send(message);
    };

    socket.on('message', function (message) {
      jrpc.messageHandler(message);
    });
  });

  jrpc.on('ping', [], () => 'ping back');

  jrpc.on('ACT_1/GET_TICKET', [], () => {
    return 'slash://b2iaqdgtgnfu2ycjmijjkfios6klkrcnhwxyvd3hw43m7c2qc6yntrd2c?act=1&tkt=LnGMvAE7L8TbA9s2VH1dSL';
  });

  return jrpc;
};
