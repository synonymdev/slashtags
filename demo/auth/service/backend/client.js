const websocket = require('isomorphic-ws');

let ws;
try {
  ws = new websocket('wss://localhost:8099');
} catch (error) {
  ws = new websocket('ws://localhost:8099');
}

console.log('Client connecting at ws://localhost:8099/');

ws.on('connection', (socket) => {
  console.log('connected');
  ws.send('hello from client');
});
ws.on('message', (message) => {
  console.log(message);
  console.log(message.toString());
  ws.send(Buffer.from('hello from client'));
});
ws.on('close', () => {
  console.log('disconnected');
});
