import test from 'ava'
import { DHT } from '../src/dht.js'
import Node from '@hyperswarm/dht'

const TESTING_RELAY_SERVER = 'ws://testnet3.hyperdht.org:8910'
const INVALID_RELAY_SERVER = 'ws://invalid.something.net'

const helperServerKey = async () => {
  const node = new Node()
  const server = node.createServer()
  await server.listen()
  return server.address().publicKey
}

const helperConnect = async (key) => {
  const node = new Node()
  const noiseSocket = node.connect(key)
  return noiseSocket.publicKey
}

test('DHT: Create normal DHT node and connect to a running server', async (t) => {
  const node = await DHT()

  const key = await helperServerKey()

  const noiseSocket = node.connect(key)

  t.deepEqual(noiseSocket.remotePublicKey, key)
})

test('DHT: Create normal DHT node and accept a connection from other', async (t) => {
  await new Promise((resolve) => {
    DHT().then(async (node) => {
      let remotePublicKey = null

      const server = node.createServer((conn) => {
        t.deepEqual(remotePublicKey, conn.remotePublicKey)
        resolve()
      })

      await server.listen()
      remotePublicKey = await helperConnect(server.address().publicKey)
    })
  })
})

test('DHT: Create relayed DHT node and connect to a running server', async (t) => {
  const node = await DHT({ relays: [TESTING_RELAY_SERVER] })

  const key = await helperServerKey()

  const noiseSocket = node.connect(key)

  t.deepEqual(noiseSocket.remotePublicKey, key)
})

test('DHT: Create relayed DHT node and accept a connection from other', async (t) => {
  await new Promise((resolve) => {
    DHT({ relays: [TESTING_RELAY_SERVER] }).then(async (node) => {
      let remotePublicKey = null

      const server = node.createServer((conn) => {
        t.deepEqual(remotePublicKey, conn.remotePublicKey)
        resolve()
      })

      await server.listen()

      remotePublicKey = await helperConnect(server.address().publicKey)
    })
  })
})

test('DHT: Try relay servers until one is working', async (t) => {
  const node = await DHT({
    relays: [INVALID_RELAY_SERVER, TESTING_RELAY_SERVER]
  })

  const key = await helperServerKey()

  const noiseSocket = node.connect(key)

  t.deepEqual(noiseSocket.remotePublicKey, key)
})

test('DHT: Throw an error if no relays worked', async (t) => {
  await t.throwsAsync(
    async () => await DHT({ relays: [INVALID_RELAY_SERVER] }),
    {
      instanceOf: Error,
      message: 'Could not connect to any of the provided DHT relays'
    }
  )
})
