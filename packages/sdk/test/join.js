import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import b4a from 'b4a'

import SDK from '../index.js'

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
