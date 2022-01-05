import JsonRPC from 'simple-jsonrpc-js';

const socketURL =
  window.location.hostname === 'localhost'
    ? 'ws://localhost:9001'
    : 'wss://slashtags.herokuapp.com';

let rpc;

export const RPC = () => {
  if (rpc) return rpc;
  const socket = new WebSocket(socketURL);
  var jrpc = new JsonRPC();

  socket.onmessage = (event) => jrpc.messageHandler(event.data);
  jrpc.toStream = (msg) => socket.send(msg);

  return new Promise((resolve, reject) => {
    socket.onopen = () => {
      rpc = jrpc;
      resolve(jrpc);
    };
  });
};
