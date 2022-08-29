import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import { format, encode } from '@synonymdev/slashtags-url'
import Hyperswarm from 'hyperswarm'
import RAM from 'random-access-memory'
import Corestore from 'corestore'

import { Slashtag } from '../index.js'

test('opening', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)

  t.is(alice.id, encode(alice.key))
  t.is(alice.url, format(alice.key))

  alice.on('ready', () => t.pass('ready emitted'))

  await alice.ready()
  t.ok(alice.opened)

  alice.close()
})

test('opening - announce identity core', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.ready()

  await alice.core.append(['foo'])

  const swarm = new Hyperswarm(testnet)
  const corestore = new Corestore(RAM)
  swarm.on('connection', socket => corestore.replicate(socket))

  const clone = corestore.get({ key: alice.key })
  await clone.ready()

  swarm.join(clone.discoveryKey, { client: true, server: false })
  const done = clone.findingPeers()
  swarm.flush().then(done, done)
  await clone.update()

  t.is(clone.length, 1)

  alice.close()
  swarm.destroy()
})

test('close', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  await alice.ready()

  alice.on('close', () => t.pass('close emitted'))
  const closing = alice.close()

  t.is(alice.close(), closing, "don't attempt closing twice")
  await closing

  t.ok(alice.swarm.destroyed)
  t.ok(alice.closed)

  t.alike(alice.eventNames(), [], 'remove all event listeners on close')
  t.ok(alice.closed)
})

test('close - should not destroy passed DHT', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const swarm = new Hyperswarm(testnet)

  const alice = new Slashtag({ _swarm: swarm })
  await alice.ready()

  await alice.close()

  t.ok(alice.closed)
  t.absent(swarm.dht.destroyed)

  await swarm.destroy()

  t.ok(swarm.dht.destroyed)
})
