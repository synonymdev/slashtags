import test from 'ava'
import { Core } from '../src/index.js'

test('RPC: Nonexistent method', async (t) => {
  const node1 = await Core()
  const destination = await node1.listen()

  const node2 = await Core()

  const response = await node2.request(destination, 'ping', { test: 1 })

  t.deepEqual(response, {
    code: -32601,
    message: 'Method not found. The method does not exist / is not available.',
    data: 'ping'
  })
})

test('RPC: Existing method', async (t) => {
  const node1 = await Core()
  node1.use('ping', [], () => 'pong')

  const destination = await node1.listen()

  const node2 = await Core()

  const response = await node2.request(destination, 'ping', [])

  t.deepEqual(response, 'pong')
})

test('RPC: Acting as server and client', async (t) => {
  const node1 = await Core()
  node1.use('ping', [], () => 'pong')
  const destination1 = await node1.listen()

  const node2 = await Core()
  node2.use('ping', [], () => 'pong')
  const destination2 = await node2.listen()

  t.deepEqual(await node2.request(destination1, 'ping', []), 'pong')

  const node3 = await Core()
  t.deepEqual(await node3.request(destination2, 'ping', []), 'pong')
})
