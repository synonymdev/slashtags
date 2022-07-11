import b4a from 'b4a';
import logUpdate from 'log-update';
import { SDK } from '@synonymdev/slashtags-sdk';

const driveOpts = {
  key: b4a.from(
    'cd3aeb572d46ba89d179d2ef0380d7ad34ce7f0f2ad8f1246a5638f93160c056',
    'hex',
  ),
  encryptionKey: b4a.from(
    'de5c4cc0a99fc2b818ad1100b2dbe7c316d821d329ce6448b0e0af3a748f812e',
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
