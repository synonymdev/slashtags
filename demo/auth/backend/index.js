// @ts-nocheck
// Server side code
const { createAuth } = require('@synonymdev/slashtags-auth');
const { secp256k1 } = require('noise-curve-tiny-secp');
const WebSocket = require('ws');

// Just configuring the server
const seed = Buffer.alloc(32);
seed.write('Haystack server');
const serverKeys = secp256k1.generateSeedKeyPair('backend');

console.log('Server public key:', serverKeys.publicKey.toString('hex'));

const { responder } = createAuth(serverKeys, {
  metadata: {
    service: {
      name: 'Bitfinex',
      account: 'http://localhost:9090/account',
      logo: 'https://pbs.twimg.com/profile_images/1365263904948051968/Zln4ecyb_400x400.png',
    },
  },
});

// Users who signed in before
const trustedUsers = {
  '036940ca31bd4346da7774314932be7185c1cd832b0a0bd84e6798dc5cdb168590':
    'Hal Finney',
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
      console.log('login request');
      socket.send(
        JSON.stringify({
          type: 'challenge',
          publicKey: Buffer.from(serverKeys.publicKey).toString('hex'),
          challenge: Buffer.from(
            responder.newChallenge(2 * 60 * 1000),
          ).toString('hex'),
        }),
      );
    }
  });
});

const express = require('express');
const app = express();
const port = 9090;

app.use(require('cors')());
app.use(express.json());

app.post('/response', (req, res) => {
  let result;
  try {
    result = responder.verifyInitiator(
      Uint8Array.from(Buffer.from(req.body.attestation, 'hex')),
    );
  } catch (error) {
    console.log({ error: error.message });
    return;
  }

  const publicKey = Buffer.from(result.initiatorPK).toString('hex');
  console.log({
    initiator: publicKey,
    metadata: result.metadata,
  });

  if (blockedUsers.includes(publicKey)) {
    res.writeHead(401, { 'Access-Control-Allow-Origin': '*' });
    socketSend(JSON.stringify({ type: 'Begone!', user: { publicKey } }));
    res.end();
  } else {
    socketSend(
      JSON.stringify({
        type: 'authed',
        user: {
          name: trustedUsers[publicKey] || result.metadata.name,
          publicKey: publicKey,
        },
      }),
    );

    res.send({
      responderAttestation: Buffer.from(result.responderAttestation).toString(
        'hex',
      ),
    });
  }
});

app.get('/account', (req, res) => {
  res.send(
    JSON.stringify({
      schema: {
        title: 'An account form',
        description: 'A simple form example.',
        type: 'object',
        properties: {
          accountName: {
            type: 'string',
            title: 'Account Name',
          },
          balance: {
            type: 'number',
            title: 'Account Balance',
          },
          userName: {
            type: 'string',
            title: 'Username',
          },
          connected: {
            type: 'string',
            title: 'Connected',
            format: 'date-time',
          },
        },
      },
      data: {
        accountName: 'Ralph Edwards',
        userName: 'redwards',
        connected: '2021-09-23T09:45:08.368Z',
        balance: 1456853,
      },
    }),
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
