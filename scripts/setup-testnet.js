const DHT = require('@hyperswarm/dht');
const { setupRelay } = require('dht-universal/setup-relay.js');

const setupTestnet = async () => {
  const node = new DHT({ ephemeral: true, bootstrap: [] });
  await node.ready();

  const nodes = [node];

  const bootstrap = [{ host: '127.0.0.1', port: node.address().port }];

  for (let i = 1; i < 4; i++) {
    const dht = (nodes[i] = new DHT({ ephemeral: false, bootstrap }));
    await dht.ready();
  }

  const { port, closeRelay } = await setupRelay({ dhtOpts: { bootstrap } });

  const relay = 'ws://localhost:' + port;

  return {
    bootstrap,
    relay,
    closeBootstrap: () => Promise.all(nodes.map((node) => node.destroy())),
    closeRelay: closeRelay,
  };
};

module.exports = {
  setupTestnet,
};
