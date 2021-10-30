const { base32 } = require('multiformats/bases/base32');
const { varint } = require('@synonymdev/slashtags-common');
const { JsonRpcEngine } = require('json-rpc-engine');
const { base58btc } = require('multiformats/bases/base58');

const { createAuth } = require('@synonymdev/slashtags-auth');
const { secp256k1: curve } = require('noise-curve-tiny-secp');
const { randomBytes } = require('crypto');
const URI = require('urijs');

const keypair = curve.generateSeedKeyPair('slashtags-demo');
const auth = createAuth(keypair, {
  metadata: {},
});

/**
 *
 * @param {Object} opts
 * @param {string} [opts.baseURL]
 * @param {import('ws').WebSocketServer} [opts.wss]
 * @returns
 */
module.exports = ({ wss, baseURL }) => {
  if (!wss) throw new Error('wss must be provided');

  // Tickets callbacks correlation
  const callbacksMap = new Map();

  const engine = new JsonRpcEngine();

  wss.on('connection', (socket, request) => {
    socket.onmessage = ({ target, data }) => {
      try {
        const json = JSON.parse(data.toString());

        engine.handle(json, (err, res) => {
          socket.send(JSON.stringify(res));
        });
      } catch (error) {
        socket.send(
          JSON.stringify({ error: { code: -32700, message: 'Parse error' } }),
        );
      }
    };
  });

  // Slsashtags
  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/GET_CHALLENGE') {
      const { ticket } = req.params;

      const challenge = auth.responder.newChallenge(60 * 1000 * 5);

      const metadata = callbacksMap.get(ticket)?.onChallenge();

      res.result = {
        publicKey: keypair.publicKey.toString('hex'),
        challenge: Buffer.from(challenge).toString('hex'),
        metadata,
      };

      end();
    }
    next();
  });

  engine.push((req, res, next, end) => {
    if (req.method === 'ACT_1/RESPOND') {
      const { attestation, ticket } = req.params;

      try {
        const callbacks = callbacksMap.get(ticket);

        if (!callbacks) {
          end(new Error('Expired ticket'));
          return;
        }

        const { metadata, initiatorPK, responderAttestation } =
          auth.responder.verifyInitiator(Buffer.from(attestation, 'hex'));

        callbacksMap.get(ticket)?.onVerify({ metadata, initiatorPK });

        res.result = {
          attestation: Buffer.from(responderAttestation).toString('hex'),
        };

        callbacksMap.delete(ticket);
      } catch (error) {
        res.error = error.message;
      }
      end();
    }
    next();
  });

  // ==========

  if (!baseURL) throw new Error('baseURL must be provided');
  const socketURL = baseURL?.replace(/^http/, 'ws');
  const address = base32.encode(
    varint.prepend([210, 0, 0], Buffer.from(socketURL)),
  );

  return {
    /**
     *
     * @param {object} opts
     * @param {string} opts.action
     * @param {Record<string, Record<string, ()=>void>>} opts.callbacks
     * @param {number} [opts.timeout]
     * @returns
     */
    generateURL: ({ action, callbacks, timeout = 2 * 60 * 1000 }) => {
      const url = new URI({
        protocol: 'slash',
        hostname: address,
      });

      url.addQuery('act', action.replace(/^ACT_/, ''));

      const ticket = base58btc.encode(randomBytes(8));

      callbacksMap.set(ticket, callbacks[action]);

      setTimeout(() => {
        callbacksMap.delete(ticket);
      }, timeout);

      url.addQuery('tkt', ticket);

      return url.toString();
    },
  };
};
