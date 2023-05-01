const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const Hyperswarm = require('hyperswarm')
const b4a = require('b4a')

const SDK = require('../index.js')

test('join - deduplicate discovery', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK(testnet)

  const topic = b4a.alloc(32).fill('foo')

  await sdk.join(topic)?.flushed()
  sdk.join(topic)

  await sdk.swarm.flush()

  t.is([...sdk.swarm.topics()].length, 1)
  t.alike(sdk.swarm.topics().next().value.topic, topic)
  t.is(sdk.swarm.topics().next().value._sessions.length, 1)

  await sdk.close()
})

test('join - reannounce if options are different', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK(testnet)

  const topic = b4a.alloc(32).fill('foo')

  sdk.join(topic, { server: true, client: true })
  sdk.join(topic, { server: false, client: true })
  sdk.join(topic, { server: false, client: false })

  await sdk.swarm.flush()

  t.is([...sdk.swarm.topics()].length, 1)
  t.alike(sdk.swarm.topics().next().value.topic, topic)
  t.is(sdk.swarm.topics().next().value._sessions.length, 3)

  await sdk.close()
})

test('join - seeders', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK(testnet)

  const seeder = new Hyperswarm(testnet)
  const topic = b4a.from('3b9f8ccd062ca9fc0b7dd407b4cd287ca6e2d8b32f046d7958fa7bea4d78fd75', 'hex')
  await seeder.join(topic).flushed()

  const peer = await sdk.joinSeeders()

  t.alike(peer.publicKey, seeder.keyPair.publicKey)

  await seeder.destroy()
  await sdk.close()
})
