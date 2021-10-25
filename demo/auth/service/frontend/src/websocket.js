import simple_jsonrpc from 'simple-jsonrpc-js';

export const RPC = () => {
  const socket = new WebSocket(
    'https://slashtags-demo-backend.herokuapp.com'.replace(/^http/, 'ws'),
  );

  var jrpc = new simple_jsonrpc();

  socket.onmessage = function (event) {
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
  socket.onopen = function () {
    //calls
    jrpc.call('ping').then(function (result) {
      console.log('ping: ' + result);
    });
  };

  return jrpc;
};
