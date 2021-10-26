const { base32 } = require('multiformats/bases/base32');
const { base58btc } = require('multiformats/bases/base58');
const { varint } = require('@synonymdev/slashtags-common');
const { randomBytes } = require('crypto');
const websocket = require('isomorphic-ws');
const { JsonRpcEngine } = require('json-rpc-engine');

const { createAuth } = require('@synonymdev/slashtags-auth');
const { secp256k1: curve } = require('noise-curve-tiny-secp');

const basicProfile = {
  title: 'Slashtags Demo',
  image: 'https://i.ibb.co/BTLdR17/Screenshot-from-2021-10-25-06-15-09.png',
};

const keypair = curve.generateSeedKeyPair('slashtags-demo');
const auth = createAuth(keypair, {
  metadata: basicProfile,
});

module.exports = (server) => {
  const ws = new websocket.Server({ server });

  const engine = new JsonRpcEngine();

  const url = process.env.PORT
    ? 'wss://slashtags.herokuapp.com'
    : 'ws://localhost:9000';

  const url32 = base32.encode(varint.prepend([210, 0, 0], Buffer.from(url)));

  const sockets = new Map();

  ws.on('connection', function (socket) {
    const socketID = base58btc.encode(randomBytes(8));
    sockets.set(socketID, socket);

    socket.on('message', function (message) {
      try {
        const json = JSON.parse(message.toString());
        json.socketID = socketID;

        console.log('message', json);

        engine.handle(json, (err, res) => {
          socket.send(JSON.stringify(res));
        });
      } catch (error) {
        socket.send(
          JSON.stringify({ error: { code: -32700, message: 'Parse error' } }),
        );
      }
    });
  });

  engine.push((req, res, next, end) => {
    if (req.method === 'ping') {
      res.result = 'pong';
      end();
    }
    next();
  });

  // Slsashtags
  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/REQUEST_TICKET') {
      res.result = 'slash://' + url32 + '/?act=1&tkt=' + req.socketID;
      end();
    }
    next();
  });

  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/GET_CHALLENGE') {
      const challenge = auth.responder.newChallenge(60 * 1000 * 5);

      res.result = {
        publicKey: keypair.publicKey.toString('hex'),
        challenge: Buffer.from(challenge).toString('hex'),
        title: basicProfile.title,
        image: basicProfile.image,
      };

      end();
    }
    next();
  });

  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/RESPOND') {
      const { attestation, ticket } = req.params;

      try {
        const { metadata, initiatorPK, responderAttestation } =
          auth.responder.verifyInitiator(Buffer.from(attestation, 'hex'));

        res.result = {
          attestation: Buffer.from(responderAttestation).toString('hex'),
        };

        const socket = sockets.get(ticket);

        if (!socket) {
          end(new Error('Expired ticket'));
        }

        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'UserAuthenticated',
            params: {
              publicKey: Buffer.from(initiatorPK).toString('hex'),
              metadata,
            },
          }),
        );
        console.log('User authenticated');

        sockets.delete(ticket);
      } catch (error) {
        res.error = error.message;
      }
      end();
    }
    next();
  });

  engine.push((req, res, next, end) => end());

  return ws;
};
