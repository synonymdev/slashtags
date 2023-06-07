const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const RAM = require('random-access-memory')

const SDK = require('../index.js')

test('pass sdk options', async (t) => {
  const seeders = [Buffer.alloc(32).fill(255)]

  const sdk = new SDK({ storage: RAM, seeders })
  const alice = sdk.slashtag('alice')

  t.alike(alice.coreData._seeders, seeders)

  await sdk.close()
})

test('slashtag - deduplicate', async (t) => {
  const sdk = new SDK({ storage: RAM })

  const alice = sdk.slashtag('alice')
  const again = sdk.slashtag('alice')

  t.is(again, alice)

  await alice.close()

  t.is(sdk.slashtags.size, 0, 'remove closed slashtags')

  await sdk.close()
})

test('slashtag - share dht', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const bob = sdk.slashtag('bob')

  t.is(alice.dht, bob.dht)

  await alice.listen()
  const socket = bob.connect(alice.url)

  t.ok(await socket.opened)

  await bob.close()
  await alice.close()

  t.absent(sdk.dht.destroyed)

  await sdk.close()

  t.ok(sdk.dht.destroyed)
})

test('slashtag - announce public drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await drive.ready()

  const discovery = sdk.swarm.topics().next().value
  t.ok(discovery.isClient)
  t.ok(discovery.isServer)
  t.alike(discovery.topic, drive.discoveryKey)

  await sdk.close()
})
