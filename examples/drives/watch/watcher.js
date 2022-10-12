import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

const url = 'slashfeed:xetgp4u9hrhdbzhfkmmc6goe96754of4jxhzqcpdtecbq5ykj3py#encryptionKey=6fq36pb1657x33cbzkg56zpxqpo76xqby8jgnixnztrte86kphbo'

const sdk = new SDK({ storage: RAM });
const watcher = sdk.drive(url)
await watcher.ready()
console.log("Watching: ", url)

watcher.core.on('append', async () => {
  const trade = await watcher.get('/feeds/bitfinex/latest-trade')
  const tradeString = b4a.toString(trade);
  logUpdate('Latest trade:', tradeString);
});
