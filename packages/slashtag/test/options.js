const test = require('brittle')
const DHT = require('hyperdht')
const createTestnet = require('@hyperswarm/testnet')

const Slashtag = require('../index.js')

test('options - empty options', async t => {
  const alice = new Slashtag()
  t.pass()
  await alice.close()
})

test('options - keyPair', async t => {
  const alice = new Slashtag()

  const other = new Slashtag({ keyPair: alice.keyPair })

  t.alike(other.keyPair, alice.keyPair)

  const drive = other.drivestore.get()
  await drive.ready()
  t.alike(drive.key, alice.key)

  await alice.close()
  await other.close()
})

test('options - corestore', async t => {
  const alice = new Slashtag()
  const other = new Slashtag({ corestore: alice.drivestore.corestore.namespace('foo') })

  const a = alice.drivestore.get()
  const b = other.drivestore.get()
  await Promise.all([a.ready(), b.ready()])

  t.unlike(a.key, b.key)

  await alice.close()
  await other.close()
})

test('options - dht', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const dht = new DHT(testnet)
  const alice = new Slashtag({ dht })

  t.unlike(alice.keyPair, dht.defaultKeyPair)
  t.unlike(alice.keyPair, dht.defaultKeyPair)

  await alice.listen()
  t.alike(alice.server.address().publicKey, alice.key)

  const socket = alice.connect(dht.defaultKeyPair.publicKey)
  t.alike(socket.publicKey, alice.key)

  await alice.close()
  await dht.destroy()
})
