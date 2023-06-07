import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK, { SlashURL } from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

console.log('Setting up slashtag...');
const sdk = new SDK({
  storage: RAM,
  primaryKey: b4a.from('a'.repeat(64), 'hex'),
});

const alice = sdk.slashtag('alice');
await alice.ready()
await alice.coreData.create('/trades-feed/latest-trade', b4a.from(''));

const FILE_PATH = '/trades-feed/latest-trade'

console.log(`Serving feed ${await alice.coreData.createURL(FILE_PATH)}\n`);

await write()
setInterval(write, 500);

function write() {
  const trade = {
    amount: Math.random(),
    price: Math.ceil(60000 + Math.random() * 60000),
    type: Math.random() > 0.5 ? 'Buy' : 'Sell',
  };
  const tradeString = JSON.stringify(trade, null, 2);
  logUpdate('Latest trade:', tradeString);

  return alice.coreData.update(FILE_PATH, b4a.from(tradeString));
}
