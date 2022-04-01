const fs = require('fs');
const createTestnet = require('@hyperswarm/testnet');
const { setupRelay } = require('dht-universal/setup-relay.js');

const main = async () => {
  const nodes = await createTestnet(10);
  const bootstrap = [{ host: '127.0.0.1', port: nodes[0].address().port }];

  const { port } = await setupRelay({
    dhtOpts: { bootstrap },
    wsServerOptions: { port: 8888 },
  });
  const relay = 'ws://localhost:' + port;

  const dotenv = fs.readFileSync('.env', 'utf8');
  const toSave =
    dotenv.replace(/\n\n/g, '\n').replace(/BOOTSTRAP=.*\n?/g, '') +
    ('\nBOOTSTRAP=' + JSON.stringify(bootstrap));
  fs.writeFileSync('.env', toSave);

  console.log('Testnet bootstrap now available at .env');
  console.log('bootstrap', bootstrap);
  console.log('DHT Relay: ' + relay);
};

main();
