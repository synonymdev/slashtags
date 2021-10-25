const WS = require('./websocket');
const PORT = process.env.PORT || 9000;

run();

function run() {
  const fastify = require('fastify')({
    logger: true,
  });

  WS(fastify.server);

  fastify.get('/', (req, res) => {
    res.send('Alive');
  });

  fastify.listen(PORT, function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Server is now listening on ${address}`);
  });
}
