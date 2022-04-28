const fs = require('fs');
const createTestnet = require('@hyperswarm/testnet');
const { setupRelay } = require('dht-universal/setup-relay.js');

const main = async () => {
  const testnet = await createTestnet(3);

  const { port } = await setupRelay({
    dhtOpts: { bootstrap: testnet.bootstrap },
    wsServerOptions: { port: 8888 },
  });
  const relay = 'ws://localhost:' + port;

  let dotenv;
  try {
    dotenv = fs.readFileSync('.env', 'utf8');
  } catch (error) {
    dotenv = '';
  }
  const toSave =
    dotenv.replace(/\n\n/g, '\n').replace(/BOOTSTRAP=.*\n?/g, '') +
    ('\nBOOTSTRAP=' + JSON.stringify(testnet.bootstrap));
  fs.writeFileSync('.env', toSave, {});

  console.log('Testnet bootstrap now available at .env');
  console.log('bootstrap', testnet.bootstrap);
  console.log('DHT Relay: ' + relay);
};

main();
