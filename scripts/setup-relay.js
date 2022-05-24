const { setupRelay } = require('dht-universal/setup-relay.js')

const main = async () => {
  const { port } = await setupRelay({
    wsServerOptions: { port: 8888 }
  })
  const relay = 'ws://localhost:' + port

  console.log('DHT mainnet Relay: ' + relay)
}

main()
