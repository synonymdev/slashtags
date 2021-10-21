import { Core } from './index.js';
import { secp256k1 } from 'noise-curve-tiny-secp';

const main = async () => {
  if (process.env.N === 'client') {
    const node = await Core({
      keyPair: secp256k1.generateSeedKeyPair('client'),
    });

    setInterval(() => {
      node.request({
        dest: 'a1b6c0581994f2e2dacc98a721622d32a97b5d2ae0ccd6f69786507e8a22f064',
        message: 'ping' + Math.random(),
      });
    }, 1000);
  } else {
    const node = await Core({
      keyPair: secp256k1.generateSeedKeyPair('server'),
    });

    const feed = await node.listen();

    setTimeout(() => {
      feed.close();
    }, 10000);
  }
};

main();
