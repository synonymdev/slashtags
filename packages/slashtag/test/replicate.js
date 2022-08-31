import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'

import { Slashtag } from '../index.js'

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

  t.alike(core.peers[0].remotePublicKey, bob.key)
  t.alike(clone.peers[0].remotePublicKey, alice.key)

  await alice.close()
  await bob.close()
})
