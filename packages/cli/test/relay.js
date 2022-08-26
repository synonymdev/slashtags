import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import WebSocket from 'ws'

import DHT from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'

import { setupRelay } from '../lib/relay.js'

test('basic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const relay = await setupRelay(testnet)

  const node = await relayedDHT(relay.port)

  relay.close()
  node.destroy()
})

/** @param {number} port */
async function relayedDHT (port) {
  const socket = new WebSocket('ws://localhost:' + port)

  await new Promise((resolve, reject) => {
    socket.on('error', () =>
      reject(new Error('Could not connect to Slashtags relay'))
    )
    socket.on('open', resolve)
  })

  return new DHT(new Stream(true, socket))
}
