import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import RAM from 'random-access-memory'
import c from 'compact-encoding'

import SDK from '../index.js'

test('drive - resolve public drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await drive.ready()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('profile.json', c.encode(c.json, profile))

  // other side
  const remote = new SDK({ ...testnet, storage: RAM })
  const clone = remote.drive(drive.key)
  await clone.ready()

  const buf = await clone.get('profile.json')
  const resolved = buf && c.decode(c.json, buf)

  t.alike(resolved, profile)

  await sdk.close()
  await remote.close()
})

test('drive - blind seeder resolve private drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const publicDrive = alice.drivestore.get()
  await publicDrive.ready()

  const drive = alice.drivestore.get('/contacts')
  await drive.ready()
  await sdk.swarm.flush()

  const contact = { name: 'alice' }
  await drive.put('/foo', c.encode(c.json, contact))

  // other side
  const seeder = new SDK({ ...testnet, storage: RAM })

  const clone = seeder.drive(drive.key)
  await clone.ready()

  seeder.join(publicDrive.discoveryKey)

  await t.exception(clone.get('/foo'), /.*/, "blind seeder can't reed private drive")
  t.is(clone.core.length, 2, 'still can replicate')

  await sdk.close()

  await sdk.close()
  await seeder.close()
})
