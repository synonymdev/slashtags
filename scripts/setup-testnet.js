import DHT from '@hyperswarm/dht';
import { setupRelay } from 'dht-universal/setup-relay.js';

const setupBootstrap = async () => {
  const node = new DHT({ ephemeral: true, bootstrap: [] });
  await node.ready();

  const nodes = [node];

  const bootstrap = [{ host: '127.0.0.1', port: node.address().port }];

  for (let i = 1; i < 4; i++) {
    const dht = (nodes[i] = new DHT({ ephemeral: false, bootstrap }));
    await dht.ready();
  }

  return {
    bootstrap,
    closeBootstrap: () => Promise.all(nodes.map((node) => node.destroy())),
  };
};

(async () => {
  const { bootstrap, closeBootstrap } = await setupBootstrap();
  const { port } = await setupRelay({ dhtOpts: { bootstrap } });

  console.log('Running dht-relay: ws://localhost:' + port);
})();
