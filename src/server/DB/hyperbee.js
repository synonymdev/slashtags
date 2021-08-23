import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import curve from 'noise-handshake/dh.js';

export const setupHyperBee = async () => {
  const seed = Buffer.alloc(32);
  seed.write('Slashtag-mvp_user-seed');

  // TODO: figure out how to use a public key with hypercore.
  const keys = curve.generateSeedKeyPair(seed);

  const feed = new Hypercore('/tmp/slashtagDB_MVP');

  let bee = new Hyperbee(feed, {
    keyEncoding: 'utf8',
    valueEncoding: 'json',
  });

  await bee.ready();
  return bee;
};
