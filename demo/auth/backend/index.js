// Server side code
import { createAuth } from '@synonymdev/slashtags-auth';
import { secp256k1 } from 'noise-curve-secp256k1';
import http from 'http';
import url from 'url';
import * as WebSocket from 'ws';

// Just configuring the server
const seed = Buffer.alloc(32);
seed.write('Haystack server');
const serverKeys = secp256k1.generateSeedKeyPair('backend');

console.log('Server public key:', serverKeys.publicKey.toString('hex'));

const auth = createAuth(serverKeys, { metadata: { server: 'bitfinex' } });

// Users who signed in before
const trustedUsers = {
  '036940ca31bd4346da7774314932be7185c1cd832b0a0bd84e6798dc5cdb168590': 'Hal',
};

const blockedUsers = [
  '02295ec9863d771bed88bd59820fa91eb8d8ce6bdff491d02b74b4f81085c9a05a',
];

// WebSocket server
//  For signing in and pushing the result to the client,
//  since the latest steps are done by the wallet instead.
const wss = new WebSocket.WebSocketServer({
  port: 9000,
});

let socketSend;

wss.on('connection', (socket) => {
  socketSend = (msg) => socket.send(msg);

  socket.on('message', (msg) => {
    msg = JSON.parse(msg);

    if (msg.type === 'login') {
      socket.send(
        JSON.stringify({
          type: 'challenge',
          publicKey: Buffer.from(serverKeys.publicKey).toString('hex'),
          challenge: Buffer.from(auth.newChallenge(2 * 60 * 1000)).toString(
            'hex',
          ),
        }),
      );
    }
  });
});

// HTTP Server
//  At least one GET endpoint for Slashtag URL to work with.
http
  .createServer((req, res) => {
    const query = { ...url.parse(req.url, true).query };

    console.log('request:', req.url);

    if (req.url.slice(0, 8) === '/answer/') {
      let result;
      try {
        result = auth.verify(
          Uint8Array.from(Buffer.from(query.attestation, 'hex')),
        );
      } catch (error) {
        console.log({ error: error.message });
        return;
      }

      if (result.as === 'Responder') {
        const publicKey = Buffer.from(result.initiatorPK).toString('hex');
        console.log({
          initiator: publicKey,
          metadata: result.metadata,
        });

        if (blockedUsers.includes(publicKey)) {
          res.writeHead(401, { 'Access-Control-Allow-Origin': '*' });
          socketSend(JSON.stringify({ type: 'Begone!', token: { publicKey } }));
          res.end();
        } else {
          socketSend(
            JSON.stringify({
              type: 'authed',
              token: {
                user: trustedUsers[publicKey],
                publicKey: publicKey,
              },
            }),
          );
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
          res.end(
            JSON.stringify({
              responderAttestation: Buffer.from(
                result.responderAttestation,
              ).toString('hex'),
            }),
          );
        }
      }
    } else {
      // /home
      let token;

      try {
        token = JSON.parse(query.token);
      } catch (error) {}

      if (!token) {
        res.writeHead(401, { 'Access-Control-Allow-Origin': '*' });
        res.end();
      } else {
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('RIP');
      }
    }
  })
  .listen(9090);
