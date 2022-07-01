import { setupRelay } from 'dht-universal/setup-relay.js'

import { DEFAULT_PORT } from '../constants.js'

async function main () {
  setupRelay({
    wsServerOptions: { port: DEFAULT_PORT }
  })
}

main()
