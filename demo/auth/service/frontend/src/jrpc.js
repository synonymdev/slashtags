import simple_jsonrpc from 'simple-jsonrpc-js';

const socketURL =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:9000'
    : 'wss://slashtags.herokuapp.com';

let rpc;

export const RPC = () => {
  if (rpc) return rpc;

  const socket = new WebSocket(socketURL);

  var jrpc = new simple_jsonrpc();

  socket.onmessage = function (event) {
    console.log('got data', event.data);
    jrpc.messageHandler(event.data);
  };

  jrpc.toStream = function (_msg) {
    socket.send(_msg);
  };

  socket.onerror = function (error) {
    console.error('Error: ' + error.message);
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.info('Connection close was clean');
    } else {
      console.error('Connection suddenly close');
    }
    console.info('close code : ' + event.code + ' reason: ' + event.reason);
  };

  //usage
  //after connect
  return new Promise((resolve, reject) => {
    socket.onopen = () => {
      rpc = jrpc;
      resolve(jrpc);
    };
  });
};
