import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import Hyperswarm from 'hyperswarm'
import RAM from 'random-access-memory'
import Corestore from 'corestore'
import Slashtag from '../index.js'

test('join core - serve', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const a = alice.corestore.get({ name: 'foo' })
  await a.ready()

  a.append(['foo'])

  const swarm = new Hyperswarm(testnet)

  const storeB = new Corestore(RAM)
  const b = storeB.get({ key: a.key })

  await alice.join(a).flushed()

  swarm.on('connection', conn => storeB.replicate(conn))
  swarm.join(a.discoveryKey)

  const done = b.findingPeers()
  swarm.flush().then(done, done)
  await b.update()

  t.is(b.length, 1)
  t.unlike(
    b.peers[0].remotePublicKey,
    alice.key,
    'should join with random keyPair instead of identity keyPair (privacy)'
  )

  alice.close()
  swarm.destroy()
})

test('join core - resolve', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const store = new Corestore(RAM)
  const a = store.get({ name: 'foo' })
  await a.ready()

  const swarm = new Hyperswarm(testnet)
  swarm.on('connection', conn => store.replicate(conn))
  await swarm.join(a.discoveryKey).flushed()

  a.append(['foo'])

  const alice = new Slashtag(testnet)
  const b = alice.corestore.get({ key: a.key })

  await b.ready()
  alice.join(b)
  await b.update()

  t.alike(a.key, b.key)
  t.is(b.length, 1)
  t.unlike(
    a.peers[0].remotePublicKey,
    alice.key,
    'should join with random keyPair instead of identity keyPair (privacy)'
  )

  alice.close()
  swarm.destroy()
})

test('join topic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const a = alice.corestore.get({ name: 'foo' })
  await a.ready()

  a.append(['foo'])

  const swarm = new Hyperswarm(testnet)

  const storeB = new Corestore(RAM)
  const b = storeB.get({ key: a.key })

  await alice.join(a.discoveryKey).flushed()

  swarm.on('connection', conn => storeB.replicate(conn))
  swarm.join(a.discoveryKey)

  const done = b.findingPeers()
  swarm.flush().then(done, done)
  await b.update()

  t.is(b.length, 1)

  alice.close()
  swarm.destroy()
})
