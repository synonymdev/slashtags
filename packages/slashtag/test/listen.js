const test = require('brittle')
const DHT = require('hyperdht')
const createTestnet = require('@hyperswarm/testnet')

const Slashtag = require('../index.js')

test.skip('server - listen', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)

  const dht = new DHT(testnet)

  const s = t.test('server')
  s.plan(1)
  alice.on('connection', socket => {
    s.alike(socket.remotePublicKey, dht.defaultKeyPair.publicKey)
  })
  await alice.listen()

  const socket = dht.connect(alice.key)
  t.ok(await socket.opened)

  await s

  const serverSocket = alice.sockets.get(dht.defaultKeyPair.publicKey)
  t.ok(serverSocket, 'save socket in slashtag.sockets')

  await alice.close()
  await socket.destroy()
  await dht.destroy()
})

test.skip('server - unlisten', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)

  const dht = new DHT(testnet)

  const s = t.test('server')
  s.plan(1)
  alice.on('connection', () => s.pass('server connection opened'))
  await alice.listen()

  const socket = dht.connect(alice.key)
  t.ok(await socket.opened)

  await s

  await alice.unlisten()

  t.absent(alice.listening)
  t.is(alice.dht.listening.size, 1, 'unlistened on the dht')

  await alice.close()
  await socket.destroy()
  await dht.destroy()
})
