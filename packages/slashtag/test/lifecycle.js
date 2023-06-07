const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')

const Slashtag = require('../index.js')

test('open', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.ready()

  t.is(alice.dht.listening.size, 1)
  t.unlike(alice.dht.listening.values().next().value._keyPair.publicKey, alice.key, 'it should not listen automatically on slashtag key')

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
  t.is(alice.dht.listening.size, 0)

  t.ok(alice.closed)
})

test('close - close all sockets', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.listen()

  const st = t.test('server')
  st.plan(1)
  alice.on('connection', () => st.pass('got connection'))

  const bob = new Slashtag(testnet)
  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  await st

  t.is(alice.sockets.size, 1)

  await alice.close()

  t.is(alice.sockets.size, 0)

  await bob.close()
})
