import { fastify } from 'fastify';
import websocket from 'isomorphic-ws';
import JsonRPC from 'simple-jsonrpc-js';
import { metadata, keyPair } from './config.js';
import { RPC } from '@synonymdev/slashtags-rpc';
import { Auth } from '@synonymdev/slashtags-auth';
import jrpcLite from 'jsonrpc-lite';

const app = fastify({ logger: true });
const jrpc = new JsonRPC();
const PORT = Number(process.env.PORT) || 9000;
const hostanme = 'localhost' || 'slashtags.herokuapp.com';

const main = async () => {
  const node = await RPC();
  const auth = await Auth(node);

  // Websocket server
  const wss = new websocket.Server({ host: hostanme, port: PORT + 1 });
  wss.on('connection', (socket) => {
    jrpc.toStream = (message) => socket.send(message);
    socket.on('message', (message) => jrpc.messageHandler(message));

    // Methods
    jrpc.on('ping', [], () => 'pong');

    // Get a url to show as a QR code
    jrpc.on('authUrl', [], () => {
      return auth.issueURL({
        respondAs: { signer: { keyPair, type: 'ES256K' }, metadata },
        onTimeout: () =>
          socket.send(jrpcLite.notification('authUrlExpired').serialize()),
        onVerify: (user) => {
          socket.send(
            jrpcLite.notification('userAuthenticated', { user }).serialize(),
          );

          return {
            status: 'OK',
            feeds: [{ name: 'bar', schema: '', src: '' }],
          };
        },
      });
    });
  });

  app.listen(PORT, function (err, address) {
    console.log(`Server is now listenng on ${address}`);
  });
};

main();
