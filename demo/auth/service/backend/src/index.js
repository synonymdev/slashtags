const { RPC } = require('./websocket');
const https = require('https');
const http = require('http');

RPC();

run();

function run(opts) {
  const fastify = require('fastify')({
    logger: true,
  });

  fastify.listen(9000, function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Server is now listening on ${address}`);
  });
}
