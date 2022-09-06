import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

console.log('Setting up slashtag...');
const sdk = new SDK({
  storage: RAM,
  primaryKey: b4a.from('a'.repeat(64), 'hex'),
});

const alice = sdk.slashtag('alice');
const drive = alice.drivestore.get()
await drive.ready()
console.log('Serving feed...');

setInterval(() => {
  const trade = {
    amount: Math.random(),
    price: Math.ceil(60000 + Math.random() * 60000),
    type: Math.random() > 0.5 ? 'Buy' : 'Sell',
  };
  const tradeString = JSON.stringify(trade, null, 2);
  logUpdate('Latest trade:', tradeString);

  drive.put('/feeds/bitfinex/latest-trade', b4a.from(tradeString));
}, 500);
