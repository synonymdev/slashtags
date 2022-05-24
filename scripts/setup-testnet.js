const fs = require('fs')
const createTestnet = require('@hyperswarm/testnet')
const { setupRelay } = require('dht-universal/setup-relay.js')
const goodbye = require('graceful-goodbye')

const TESTNET_CONFIG_PATH = '.testnet.json'

setup()

async function setup () {
  const testnet = await createTestnet(3)

  const { port } = await setupRelay({
    dhtOpts: { bootstrap: testnet.bootstrap },
    wsServerOptions: { port: 8888 }
  })
  const relay = 'ws://localhost:' + port

  const config = {
    relay,
    bootstrap: testnet.bootstrap
  }

  setConfig(config)

  console.log('Testnet config now available at the root dir: .testnet.json')
  console.log(JSON.stringify(config, null, 2))

  goodbye(async function () {
    fs.unlinkSync(TESTNET_CONFIG_PATH)
    console.log('\nGracefully closing testnet and deleting config file')
    await testnet.destroy()
  })
}

async function setConfig (config) {
  fs.writeFileSync(TESTNET_CONFIG_PATH, JSON.stringify(config, null, 2))
}
