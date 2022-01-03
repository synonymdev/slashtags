import websocket from 'isomorphic-ws';
import JsonRPC from 'simple-jsonrpc-js';
import { metadata, keyPair } from './config.js';
import { RPC } from '@synonymdev/slashtags-rpc';
import { Auth } from '@synonymdev/slashtags-auth';
import jrpcLite from 'jsonrpc-lite';

const jrpc = new JsonRPC();
const PORT = Number(process.env.PORT) || 9000;
const hostanme = 'localhost' || 'slashtags.herokuapp.com';

const main = async () => {
  // Setting up slashtags node and the Auth module
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
      // Main USAGE: Generate a url
      return auth.issueURL({
        InitialResponse: {
          peer: {
            id: 'did:key:z6CXqY9QQX5xgjQZQjQKXyQ',
            signer: { keyPair, type: 'ES256K' },
            metadata,
          },
          foo: 'bar',
        },
        onTimeout: () => {
          socket.send(jrpcLite.notification('authUrlExpired').serialize());
        },
        onVerify: (user) => {
          socket.send(
            jrpcLite.notification('userAuthenticated', { user }).serialize(),
          );

          return {
            status: 'OK',
            foo: 'bar',
          };
        },
      });
    });
  });
};

main();
