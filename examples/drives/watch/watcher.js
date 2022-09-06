import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

const driveOpts = {
  key: b4a.from(
    '69b04ea6e3b62245048a8efe8c17c6affb91e07ea1e28c911c2acdfd4d851f5c',
    'hex',
  )
};

console.log('Setting up slashtag...');
const sdk = new SDK({
  storage: RAM,
  primaryKey: b4a.from('b'.repeat(64), 'hex'),
});
const watcher = sdk.drive(driveOpts.key)
await watcher.update()

watcher.core.on('append', async () => {
  const trade = await watcher.get('/feeds/bitfinex/latest-trade')
  const tradeString = b4a.toString(trade);
  logUpdate('Latest trade:', tradeString);
});
