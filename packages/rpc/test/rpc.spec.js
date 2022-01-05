import test from 'ava'
import { RPC } from '../src/rpc.js'

test('RPC: Nonexistent method', async (t) => {
  const node1 = await RPC()
  const destination = await node1.listen()

  const node2 = await RPC()

  try {
    await node2.request(destination, 'ping', { test: 1 })
  } catch (error) {
    t.deepEqual(error, {
      error: {
        code: -32601,
        message: 'Method not found: ping'
      },
      id: 0,
      jsonrpc: '2.0'
    })
  }
})

test('RPC: Existing method', async (t) => {
  const node1 = await RPC()
  node1.addMethods({
    ping: async () => 'pong'
  })
  const destination = await node1.listen()

  const node2 = await RPC()
  const response = await node2.request(destination, 'ping', {})

  t.deepEqual(response.body, 'pong')
})

test('RPC: Acting as server and client', async (t) => {
  const node1 = await RPC()
  node1.addMethods({ ping: async () => 'pong' })
  const destination1 = await node1.listen()

  const node2 = await RPC()
  node2.addMethods({ ping: async () => 'pong' })

  node1.addMethods({ ping: async () => 'pong' })
  const destination2 = await node2.listen()

  t.deepEqual((await node2.request(destination1, 'ping', {})).body, 'pong')

  const node3 = await RPC()
  t.deepEqual((await node3.request(destination2, 'ping', {})).body, 'pong')
})

test('RPC: Should not connect to an already open socket', async (t) => {
  const node1 = await RPC()
  node1.addMethods({ ping: async () => 'pong' })
  const destination1 = await node1.listen()

  const node2 = await RPC({ requestTimout: 600 })

  await node2.request(destination1, 'ping', {})
  const openSocket = Array.from(node2._openSockets.values())[-1]

  await new Promise((resolve) => setTimeout(() => resolve(), 200))

  await node2.request(destination1, 'ping', {})
  t.deepEqual(openSocket, Array.from(node2._openSockets.values())[-1])
})

test('RPC: should clean sockets after timeout', async (t) => {
  const node1 = await RPC()
  node1.addMethods({ ping: async () => 'pong' })
  const destination1 = await node1.listen()

  const node2 = await RPC({ requestTimout: 500 })
  await node2.request(destination1, 'ping', {})
  const openScoket = Array.from(node2._openSockets.values())[0]

  t.deepEqual(openScoket.noiseSocket.destroyed, false)
  await new Promise((resolve) => setTimeout(() => resolve(), 600))
  t.deepEqual(openScoket.noiseSocket.destroyed, true)
  t.deepEqual(Array.from(node2._openSockets.values()).length, 0)

  await node2.request(destination1, 'ping', {})
})

test('RPC: response should contain noiseSocket', async (t) => {
  const node1 = await RPC()
  node1.addMethods({ ping: async () => 'pong' })
  const destination1 = await node1.listen()

  const node2 = await RPC()

  t.deepEqual(
    (await node2.request(destination1, 'ping', {})).noiseSocket,
    Array.from(node2._openSockets.values())[0].noiseSocket
  )
})

test('RPC: request should contain noiseSocket', async (t) => {
  const node1 = await RPC()
  const destination1 = await node1.listen()

  const node2 = await RPC()

  node1.addMethods({
    ping: async (request) => {
      t.deepEqual(
        request.noiseSocket.handshakeHash.toString(),
        Array.from(
          node2._openSockets.values()
        )[0].noiseSocket.handshakeHash.toString()
      )

      return 'pong'
    }
  })

  await node2.request(destination1, 'ping', {})
})

test('RPC: listening on an already listening server', async (t) => {
  const node1 = await RPC()
  const destination = await node1.listen()
  const destination2 = await node1.listen()

  t.deepEqual(destination, destination2)
})

test('RPC: throw an error if connection failed', async (t) => {
  const node = await RPC()

  try {
    await node.request(Buffer.from('123', 'hex'), 'ping', {})
  } catch (error) {
    t.deepEqual(error, new Error('Could not find peer'))
  }
})
