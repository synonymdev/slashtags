const { setupTestnet } = require('../../scripts/setup-testnet.js');
const fs = require('fs');

const main = async () => {
  const { relay, bootstrap } = await setupTestnet({ relayPort: 8888 });

  fs.writeFileSync('testnet.json', JSON.stringify(bootstrap, null, 2));

  console.log('Testnet bootstrap now available at testnet.json');
  console.log('bootstrap', bootstrap);
  console.log('DHT Relay: ' + relay);
};

main();
