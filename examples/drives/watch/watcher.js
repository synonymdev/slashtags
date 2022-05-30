import b4a from 'b4a';
import logUpdate from 'log-update';
import { SDK } from '@synonymdev/slashtags-sdk';

const driveOpts = {
  key: b4a.from(
    '106646d24bc3067fdc31ef88008eb0da8f3bc248cb6bdb4827c616ee4989b794',
    'hex',
  ),
  encryptionKey: b4a.from(
    '1ff1ba91fcb1a4794ea6f85ee1c48296edddaae731e7cbb444d4258070c24282',
    'hex',
  ),
};

console.log('Setting up slashtag...');
const sdk = await SDK.init({
  persist: false,
  primaryKey: b4a.from('b'.repeat(64), 'hex'),
});
console.log('Setup done! Press any key to resolve feed...');

const watcher = sdk._root;

process.stdin.once('data', async () => {
  console.time('resolved feed');
  const drive = await watcher.drive(driveOpts);
  await drive.update();

  console.log('Watching remote drive', drive.readable);
  console.timeEnd('resolved feed');

  drive.on('update', async ({ key }) => {
    const trade = await drive.get(key);
    const tradeString = b4a.toString(trade);
    logUpdate('Latest trade:', tradeString);
  });
});
