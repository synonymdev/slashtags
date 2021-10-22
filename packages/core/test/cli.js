import { Core } from '../src/index.js';
import { secp256k1 } from 'noise-curve-tiny-secp';
import { EXTENSION, getFeed } from '../src/rpc/hyper/shared.js';

const main = async () => {
  const node = await Core({
    keyPair: secp256k1.generateSeedKeyPair('server'),
    methods: {
      foo: (args, callback) => {
        callback(null, args['nana'] + '_' + 'bar');
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

  const clientKeyPair = secp256k1.generateSeedKeyPair('client');

  const feed2 = await getFeed({
    keyPair: clientKeyPair,
    key: feed.key,
    server: false,
    client: true,
  });

  const ext2 = feed2.registerExtension(EXTENSION, {
    encoding: 'json',
    onmessage: (message, peer) => {
      // if (
      //   hexString(peer.stream.stream.publicKey) ===
      //   hexString(peer.remotePublicKey)
      // )
      //   return;
      console.log(
        'cli 2',
        message,
        peer.stream.stream.publicKey,
        peer.remotePublicKey,
      );
    },
    onerror: (err) => {
      console.log('err cli', err);
    },
  });

  feed2.on('peer-open', (peer) => {
    ext2.send(
      {
        jsonrpc: '2.0',
        method: 'foo',
        params: { nana: 'bobo' },
        id: 1,
      },
      peer,
    );
  });

  const client2KeyPair = secp256k1.generateSeedKeyPair('client2');
  const feed3 = await getFeed({
    keyPair: client2KeyPair,
    key: feed.key,
    server: false,
    client: true,
  });

  const ext3 = feed3.registerExtension(EXTENSION, {
    encoding: 'json',
    onmessage: (message, peer) => {
      // if (
      //   hexString(peer.stream.stream.publicKey) ===
      //   hexString(peer.remotePublicKey)
      // )
      //   return;
      console.log(
        'cli 3',
        message,
        peer.stream.stream.publicKey,
        peer.remotePublicKey,
      );
    },
    onerror: (err) => {
      console.log('err cli 3', err);
    },
  });

  feed3.on('peer-open', (peer) => {
    ext3.send(
      {
        jsonrpc: '2.0',
        method: 'foo',
        params: { nana: 'bororom' },
        id: 1,
      },
      peer,
    );
  });

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
