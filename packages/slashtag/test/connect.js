const test = require('brittle')
const DHT = require('hyperdht')
const createTestnet = require('@hyperswarm/testnet')

const Slashtag = require('../index.js')

test('listen - connect', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()

  const s = t.test('server')
  s.plan(2)
  alice.on('connection', socket => {
    s.pass('server connection opened')
    s.alike(socket.remotePublicKey, bob.key)
  })

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)
  t.is(socket.remotePublicKey, alice.key)

  await s

  await alice.close()
  await bob.close()
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
    s.alike(socket.remotePublicKey, bob.key)
  })

  const firstSocket = bob.connect(alice.key)
  t.ok(await firstSocket.opened)

  const secondSocket = bob.connect(alice.key)
  t.ok(await firstSocket.opened, 'second connection opened')

  t.is(firstSocket, secondSocket)

  await s

  await alice.close()
  await bob.close()
})

test('could not found peer', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const bob = new Slashtag(testnet)

  const socket = bob.connect(DHT.keyPair().publicKey)
  t.is(await socket.opened, false)

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

  await alice.close()
  await bob.close()
})

test('replicate drivestore on direct connections', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const core = alice.drivestore.corestore.get({ name: 'foo' })
  await core.append(['foo'])
  await alice.profile.create({ name: 'foo' })

  await alice.listen()

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  const clone = bob.drivestore.corestore.get({ key: core.key })
  await clone.update()

  t.alike(await clone.get(0), Buffer.from('foo'))

  await alice.close()
  await bob.close()
})

test('replicate coreData on direct connections', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)

  await alice.profile.create({ name: 'foo' })

  await alice.listen()

  const bob = new Slashtag(testnet)
  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  t.alike(await bob.profile.readRemote(alice.url), { name: 'foo' })

  await alice.close()
  await bob.close()
})
