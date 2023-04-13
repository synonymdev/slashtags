const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const WebSocket = require('ws')

const DHT = require('@hyperswarm/dht-relay')
const Stream = require('@hyperswarm/dht-relay/ws')

const run = require('../lib/daemon/relay.js')

test('basic', async t => {
  const testnet = await createTestnet(4, t.teardown)

  const relay = await run({ dhtOpts: testnet })

  const alice = await relayedDHT(relay.port)
  const bob = await relayedDHT(relay.port)

  const st = t.test('server')
  st.plan(1)

  const server = alice.createServer(socket => {
    st.alike(socket.remotePublicKey, bob.defaultKeyPair.publicKey)
  })
  await server.listen()

  const socket = bob.connect(server.address().publicKey)

  t.ok(await socket.opened)
  await st

  await socket.destroy()
  await relay.close()
  await alice.destroy()
  await bob.destroy()

  await server.close()
})

/** @param {number} port */
async function relayedDHT (port) {
  const socket = new WebSocket('ws://localhost:' + port)

  const dht = new DHT(new Stream(true, socket))
  await dht.ready()
  return dht
}
