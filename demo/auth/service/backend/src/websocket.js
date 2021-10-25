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

const sockets = new Map();

module.exports = (server) => {
  const ws = new websocket.Server({ server });

  const engine = new JsonRpcEngine();

  const url = process.env.PORT
    ? 'wss://slashtags-demo-backend.herokuapp.com'
    : 'ws://localhost:9000';

  const url32 = base32.encode(varint.prepend([210, 0, 0], Buffer.from(url)));

  ws.on('connection', function (socket) {
    socket.on('message', function (message) {
      console.log('got message', JSON.parse(message.toString()));

      try {
        engine.handle(JSON.parse(message.toString()), (err, res) => {
          socket.send(JSON.stringify(res));
        });
      } catch (error) {
        socket.send(
          JSON.stringify({ error: { code: -32700, message: 'Parse error' } }),
        );
      }
    });

    // Slsashtags
    engine.push((req, res, next, end) => {
      if (req.method === 'ACT_1/REQUEST_TICKET') {
        const ticket = base58btc.encode(randomBytes(8));

        sockets.set(ticket, socket);

        res.result = 'slash://' + url32 + '/?act=1&tkt=' + ticket;
        end();
      }
      next();
    });

    engine.push((req, res, next, end) => {
      if (req.method === 'ping') {
        res.result = 'pong';
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
        console.log('got attestation', attestation);

        try {
          const { metadata, initiatorPK, responderAttestation } =
            auth.responder.verifyInitiator(Buffer.from(attestation, 'hex'));

          res.result = {
            attestation: Buffer.from(responderAttestation).toString('hex'),
          };

          const socket = sockets.get(ticket);

          socket.send(JSON.stringify({ authed: initiatorPK.toString('hex') }));

          sockets.delete(ticket);
        } catch (error) {
          res.error = error.message;
        }
        end();
      }
      next();
    });

    engine.push((req, res, next, end) => end());
  });

  return ws;
};
