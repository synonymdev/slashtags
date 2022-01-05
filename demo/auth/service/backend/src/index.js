import websocket from 'isomorphic-ws';
import JsonRPC from 'simple-jsonrpc-js';
import { serverProfile, serverKeyPair } from './config.js';
import { Core } from '@synonymdev/slashtags-core';
import { Auth } from '@synonymdev/slashtags-auth';
import jrpcLite from 'jsonrpc-lite';
import { fastify } from 'fastify';

const app = fastify({ logger: true });
const jrpc = new JsonRPC();
const PORT = Number(process.env.PORT) || 9000;
const hostanme = 'localhost' || 'slashtags.herokuapp.com';

const main = async () => {
  // Setting up slashtags node and the Auth module
  const node = await Core();
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
        onTimeout: () =>
          socket.send(jrpcLite.notification('authUrlExpired').serialize()),
        onRequest: () => ({
          responder: {
            keyPair: serverKeyPair,
            profile: serverProfile,
          },
          additionalItems: [
            {
              '@context': 'https://bitfinex.com/schemas/',
              '@type': '2FA_OTP_FORM',
              '@id': 'https://bitfinex.com/schemas/2FA_OTP_FORM.json',
              schema: {
                $schema: '...',
              },
            },
          ],
        }),
        onSuccess: ({ remote }) => {
          socket.send(
            jrpcLite
              .notification('userAuthenticated', { user: remote })
              .serialize(),
          );

          return {
            status: 'OK',
            additionalItems: [
              {
                '@context': 'https://bitfinex.com/schemas/',
                '@type': 'HC_Feeds',
                '@id': 'https://bitfinex.com/feeds/user#1',
                feeds: ['123...def', 'def...123'],
              },
            ],
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
