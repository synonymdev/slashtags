import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK , {SlashURL} from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

console.log('Setting up slashtag...');
const sdk = new SDK({
  storage: RAM,
  primaryKey: b4a.from('a'.repeat(64), 'hex'),
});

const alice = sdk.slashtag();
const drive = alice.drivestore.get('foo')
await drive.ready()

// Announce drive on DHT
await sdk.join(drive.discoveryKey)?.flushed()

console.log('Serving feed...\n', SlashURL.format(drive.key, {
  protocol: 'slashfeed',
  fragment: { encryptionKey: SlashURL.encode(drive.encryptionKey) }
}));

setInterval(() => {
  const trade = {
    amount: Math.random(),
    price: Math.ceil(60000 + Math.random() * 60000),
    type: Math.random() > 0.5 ? 'Buy' : 'Sell',
  };
  const tradeString = JSON.stringify(trade, null, 2);
  logUpdate('\nLatest trade:', tradeString);

  drive.put('/feeds/bitfinex/latest-trade', b4a.from(tradeString));
}, 500);
