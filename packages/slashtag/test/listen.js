const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')

const Slashtag = require('../index.js')

test('server - listen', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const s = t.test('server')
  s.plan(1)
  alice.on('connection', socket => {
    s.alike(socket.remotePublicKey, bob.key)
  })
  await alice.listen()

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  await s

  const serverSocket = alice.sockets.get(bob.key)
  t.ok(serverSocket, 'save socket in slashtag.sockets')

  await alice.close()
  await bob.close()
})

test('server - unlisten', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const s = t.test('server')
  s.plan(1)
  alice.on('connection', () => s.pass('server connection opened'))
  await alice.listen()

  const socket = bob.connect(alice.key)
  t.ok(await socket.opened)

  await s

  await alice.unlisten()

  t.absent(alice.listening)
  t.is(alice.dht.listening.size, 1, 'unlistened on the dht')

  await alice.close()
  await bob.close()
})
