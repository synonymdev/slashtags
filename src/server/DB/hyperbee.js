import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import hyperswarm from 'hyperswarm';
import crypto from 'hypercore-crypto';
import pump from 'pump';

export const setupHyperBee = async () => {
  const seed = Buffer.alloc(32);
  seed.write('Slashtag-mvp_user-seed');

  const keys = crypto.keyPair(seed);

  const feed = new Hypercore('./.hypercores', keys.publicKey, {
    secretKey: keys.secretKey,
  });

  let bee = new Hyperbee(feed, {
    keyEncoding: 'utf8',
    valueEncoding: 'json',
  });

  await bee.ready();
  console.log(
    'Hyperbee setup, feed key:',
    bee.feed,
    bee.feed.key.toString('hex'),
  );

  // Create a new swarm instance.
  const swarm = hyperswarm();
  // Replicate whenever a new connection is created.
  swarm.on('connection', (connection, info) => {
    pump(
      connection,
      bee.feed.replicate({ initiator: info.client }),
      connection,
    );
    console.log('connected', info.peer);
  });

  // Start swarming the hypercore.
  swarm.join(bee.feed.discoveryKey, {
    announce: true,
    lookup: true,
  });

  return bee;
};
