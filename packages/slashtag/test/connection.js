import test from 'brittle'
import Hyperswarm from 'hyperswarm'
import DHT from '@hyperswarm/dht'
import createTestnet from '@hyperswarm/testnet'

import { Slashtag } from '../index.js'

test('listen on DHT server', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const s = t.test('server')
  s.plan(2)

  const alice = new Slashtag(testnet)

  const swarm = new Hyperswarm(testnet)

  alice.on('connection', socket => {
    s.pass('server connection opened')
    s.alike(socket.remoteSlashtag.publicKey, swarm.keyPair.publicKey)
  })
  await alice.listen()

  await swarm.joinPeer(alice.key)

  await s

  alice.close()
  swarm.destroy()
})

test('connect to a DHT server', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const s = t.test('server')
  s.plan(2)

  const alice = new Slashtag(testnet)
  const swarm = new Hyperswarm(testnet)

  await swarm.listen()
  const serverSocket = { destroy () {} }
  swarm.on('connection', (socket, peerInfo) => {
    s.pass('server connection opened')
    s.alike(peerInfo.publicKey, alice.key)
    serverSocket.destroy = socket.destroy.bind(socket)
  })
  const key = swarm.server.address().publicKey

  const socket = alice.connect(key)
  t.ok(await socket.opened)

  await s

  await alice.close()
  await serverSocket.destroy()

  swarm.destroy()
})

test('listen - connect', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const s = t.test('server')
  s.plan(2)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()
  alice.on('connection', socket => {
    s.pass('server connection opened')
    s.alike(socket.remoteSlashtag.publicKey, bob.key)
  })

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)
  t.is(socket.remotePublicKey, alice.key)

  await s

  alice.close()
  bob.close()
})

test('repeating connections', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const s = t.test('server')
  s.plan(2)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()
  alice.on('connection', socket => {
    s.pass('server connection opened')
    s.alike(socket.remoteSlashtag.publicKey, bob.key)
  })

  const firstSocket = bob.connect(alice.key)
  t.ok(await firstSocket.opened)

  const secondSocket = bob.connect(alice.key)
  t.ok(await firstSocket.opened, 'second connection opened')

  t.is(firstSocket, secondSocket)

  await s

  alice.close()
  bob.close()
})

test('could not found peer', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const bob = new Slashtag(testnet)

  const socket = bob.connect(DHT.keyPair().publicKey)
  t.is(await socket.opened, false)

  bob.close()
})

test('remoteSlashtag', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const s = t.test('server')
  s.plan(3)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()
  alice.on('connection', socket => {
    s.alike(socket.remoteSlashtag.publicKey, bob.key)
    s.is(socket.remoteSlashtag.id, bob.id)
    s.is(socket.remoteSlashtag.url, bob.url)
  })

  const socket = bob.connect(alice.key)

  t.alike(socket.remotePublicKey, alice.key)

  await s

  alice.close()
  bob.close()
})

test('connect to url or id', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()

  const byKey = bob.connect(alice.key)
  const byURL = bob.connect(alice.url)
  const byID = bob.connect(alice.id)

  t.ok(byKey.opened)

  t.alike(byID, byKey)
  t.alike(byURL, byKey)

  alice.close()
  bob.close()
})

test('replicate corestore on direct connections', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const core = alice.corestore.get({ name: 'foo' })
  await core.append(['foo'])

  await alice.listen()

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  const clone = bob.corestore.get({ key: core.key })
  await clone.update()

  t.is(clone.length, 1)

  alice.close()
  bob.close()
})

test('replicate over direct connections', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const core = alice.corestore.get({ name: 'foo', valueEncoding: 'utf8' })
  await core.append(['foo'])

  await alice.listen()

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)
  t.is(socket.remotePublicKey, alice.key)

  const clone = bob.corestore.get({ key: core.key, valueEncoding: 'utf8' })
  await clone.update()
  t.is(await clone.get(0), 'foo')

  t.alike(alice.key, clone.peers[0].remotePublicKey)
  t.alike(bob.key, core.peers[0].remotePublicKey)

  alice.close()
  bob.close()
})
