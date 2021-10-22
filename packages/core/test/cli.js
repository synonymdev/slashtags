import { Core } from '../src/index.js';
import { secp256k1 } from 'noise-curve-tiny-secp';
import { getFeed } from '../src/rpc/hyper/shared.js';
import hypercore from 'hypercore';

const main = async () => {
  const node = await Core({
    keyPair: secp256k1.generateSeedKeyPair('server'),
    methods: {
      foo: (args, callback) => {
        callback(null, 'bar');
      },
    },
  });

  const feed = await node.listen();

  setTimeout(() => {
    feed.close();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }, 100000);

  // ///
  // if (process.env.N === 'client') {
  //   const node = await Core({
  //     keyPair: secp256k1.generateSeedKeyPair('client'),
  //   });

  //   setInterval(() => {
  //     // dest: 'a1b6c0581994f2e2dacc98a721622d32a97b5d2ae0ccd6f69786507e8a22f064',
  //     node.client.request('foo', ['ping' + Math.random()]);
  //   }, 1000);
  // } else {
  // }
};

main();
