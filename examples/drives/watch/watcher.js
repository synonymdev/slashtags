import b4a from 'b4a';
import logUpdate from 'log-update';
import SDK from '@synonymdev/slashtags-sdk';
import RAM from 'random-access-memory'

const url = `slash:pgar7jzdsatrkbrkt59eaf6gi973dad6w8te3rehfmg94ucfd7qy/trades-feed/latest-trade#driveKey=gcrnqop9u8h9yy7qqrmrm5ae47xdwoqya431crp1snz3m8h3mwpo&encryptionKey=n9ukimccktfppduqs3eenh8np1yt8ykn4px56h1wnqe8mianbrhy`;

console.log('Setting up slashtag...');
const sdk = new SDK({ storage: RAM });
const slashtag = sdk.slashtag();

slashtag.coreData.subscribe(
  url,
  (trade) => {
    if (!trade) return
    const tradeString = b4a.toString(trade);
    logUpdate('Latest trade:', tradeString);
  }
)
