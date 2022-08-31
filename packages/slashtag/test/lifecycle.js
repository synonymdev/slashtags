import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import DHT from '@hyperswarm/dht'

import { Slashtag } from '../index.js'

test('open', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.dht.ready()
  await alice.corestore.ready()

  t.is(alice.dht.listening.size, 0, 'it should not listen automatically')

  await alice.close()
})

test('close - basic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)

  await alice.listen()

  alice.on('close', () => t.pass('close emitted'))
  const closing = alice.close()

  t.is(alice.close(), closing, "don't attempt closing twice")
  await closing

  t.ok(alice.dht.destroyed)
  t.ok(alice.closed)
  t.ok(alice.server.closed)
  t.absent(alice.listening)
  t.is(alice.dht.listening.size, 0)

  t.alike(alice.eventNames(), [], 'remove all event listeners on close')
  t.ok(alice.closed)
})

test('close - close all sockets', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.listen()

  const st = t.test('server')
  st.plan(1)
  alice.on('connection', () => st.pass('got connection'))

  const dht = new DHT(testnet)
  const socket = dht.connect(alice.key)
  t.ok(await socket.opened)

  await st

  t.is(alice.sockets.size, 1)

  await alice.close()

  t.is(alice.sockets.size, 0)

  await socket.destroy()
  await dht.destroy()
})

test('close - should not destroy passed DHT', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const dht = new DHT(testnet)

  const alice = new Slashtag({ dht })

  await alice.close()

  t.ok(alice.closed)
  t.absent(dht.destroyed)

  await dht.destroy()

  t.ok(dht.destroyed)
})
