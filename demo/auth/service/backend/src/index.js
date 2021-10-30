const { fastify } = require('fastify');
const websocket = require('isomorphic-ws');
const { JsonRpcEngine } = require('json-rpc-engine');
const { parse } = require('url');

const Acts = require('./Actions');
const { metadata } = require('./metadata');

const slashtagsActionsWSS = new websocket.Server({ noServer: true });

// Setting up the Slashtags Actions
const slashActs = Acts({
  baseURL: process.env.PORT
    ? 'wss://slashtags.herokuapp.com/slashtags'
    : 'ws://localhost:9000/slashtags',
  wss: slashtagsActionsWSS,
});

const app = fastify({ logger: true });

// Setup websocket server and json-rpc engine
const wss = new websocket.Server({ noServer: true });
const engine = new JsonRpcEngine();
wss.on('connection', (socket) => {
  socket.on('message', (message) => {
    try {
      const json = JSON.parse(message.toString());

      // Pass the calling socket to the jrpc engine
      json.socket = socket;

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

// Service routes
engine.push((req, res, next, end) => {
  if (req.method === 'ping') {
    res.result = 'pong';
    end();
  }
  next();
});

// Setting up one route for requesting new tickets
engine.push((req, res, next, end) => {
  if (req.method === 'REQUEST_TICKET') {
    const url = slashActs.generateURL({
      action: req.params.act,
      callbacks: {
        ACT_1: {
          onChallenge: () => metadata,
          onVerify: ({ metadata, initiatorPK }) => {
            req.socket.send(
              JSON.stringify({
                method: 'UserAuthenticated',
                params: {
                  metadata,
                  publicKey: Buffer.from(initiatorPK).toString('hex'),
                },
              }),
            );
          },
        },
      },
    });

    res.result = url;

    end();
  }
  next();
});

app.server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  if (pathname === '/') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/slashtags') {
    slashtagsActionsWSS.handleUpgrade(request, socket, head, function done(ws) {
      slashtagsActionsWSS.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

app.get('/', (req, res) => {
  res.send('Alive');
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, '0.0.0.0', function (err, address) {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server is now listenng on ${address}`);
});
