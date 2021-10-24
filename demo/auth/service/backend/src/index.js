const { RPC } = require('./websocket');

const jrpc = RPC();

jrpc.on('ping', [], () => 'ping back');

jrpc.on('ACT_1/GET_TICKET', [], () => {
  return 'slash://b2iaqdgtgnfu2ycjmijjkfios6klkrcnhwxyvd3hw43m7c2qc6yntrd2c?act=1&tkt=LnGMvAE7L8TbA9s2VH1dSL';
});

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
