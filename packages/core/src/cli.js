import { Core } from './index.js';
import { secp256k1 } from 'noise-curve-tiny-secp';

const main = async () => {
  if (process.env.N === 'client') {
    const node = await Core({
      keyPair: secp256k1.generateSeedKeyPair('client'),
    });

    setInterval(() => {
      node.request({
        dest: 'e7b1490d469a78fe72d3c14a011d9a9a67edf6db2b7ed18690c5aa67a8435f63',
        message: 'ping' + Math.random(),
      });
    }, 1000);
  } else {
    const node = await Core({
      keyPair: secp256k1.generateSeedKeyPair('server'),
    });

    const feed = node.listen();
    node.listen();
    node.listen();

    await feed.ready();
  }
};

main();
