const express = require('express');
const cors = require('cors');
// const endpoints = require('./endpoints');
const { createAuth } = require('@synonymdev/slashtags-auth');
const { secp256k1 } = require('noise-curve-tiny-secp');
const WebSocketServer = require('rpc-websockets').Server;
// const SlashActs = require('./slashacts');

const REMOTE_HOST = '';
const HOST = process.env.NODE_ENV === 'dev' ? 'localhost' : REMOTE_HOST;

const serverKeyPair = secp256k1.generateSeedKeyPair('backend');

console.log('Server public key:', serverKeyPair.publicKey.toString('hex'));

const auth = createAuth(serverKeyPair, {
  metadata: {
    service: {
      title: 'Bitfinex',
      image:
        'https://pbs.twimg.com/profile_images/1365263904948051968/Zln4ecyb_400x400.png',
    },
  },
});

// WebSocket server between the server and web interface
var wss = new WebSocketServer({
  port: 9000,
  host: HOST,
});

// Initialize actions handler

// const slashtActs = new SlashActs({});

wss.register('slashAct_1/init', function (params) {
  console.log('got slashAct_1', params);
  return {
    publicKey: Buffer.from(serverKeyPair.publicKey).toString('hex'),
    challenge: Buffer.from(auth.responder.newChallenge(2 * 60 * 1000)).toString(
      'hex',
    ),
  };
});

const app = express();

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('Hello World!'));
// app.get('/account', endpoints.getAccountFeed);

const port = Number(process.env.PORT) || 9090;
app.listen(port, HOST, () =>
  console.log(`Listening at http://${HOST}:${port}`),
);
