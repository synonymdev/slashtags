import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import RAM from 'random-access-memory'
import c from 'compact-encoding'
import b4a from 'b4a'

import SDK from '../index.js'

test('drive - resolve public drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', c.encode(c.json, profile))

  // other side
  const remote = new SDK({ ...testnet, storage: RAM })
  const clone = remote.drive(drive.key)

  const buf = await clone.get('/profile.json')
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

  const drive = alice.drivestore.get('contacts')
  await sdk.swarm.flush()

  const contact = { name: 'alice' }
  await drive.put('/foo', c.encode(c.json, contact))

  // other side
  const seeder = new SDK({ ...testnet, storage: RAM })

  const clone = seeder.drive(drive.key)

  seeder.join(publicDrive.discoveryKey)

  await t.exception(clone.get('/foo'), /.*/, "blind seeder can't reed private drive")
  t.is(clone.core.length, 2, 'still can replicate')

  await sdk.close()

  await sdk.close()
  await seeder.close()
})

test('drive - internal hyperdrive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', c.encode(c.json, profile))

  const readonly = sdk.drive(alice.key)

  t.alike(
    await readonly.get('/profile.json')
      .then(buf => buf && c.decode(c.json, buf)),
    profile,
    'correctly open a readonly drive session of local drive'
  )

  const discovery = sdk.swarm._discovery.get(b4a.toString(drive.discoveryKey, 'hex'))
  // @ts-ignore
  t.is(discovery._sessions.length, 1)
  t.is(discovery?._clientSessions, 1)
  t.is(discovery?._serverSessions, 1)
  t.ok(discovery?.isClient)
  t.ok(discovery?.isServer)

  await sdk.close()
})

test('drive - no unnecessary discovery sessions', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const sdk = new SDK({ ...testnet, storage: RAM })
  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const remote = new SDK({ ...testnet, storage: RAM })
  const clone = remote.drive(drive.key)
  await clone.ready()

  for (let i = 0; i < 10; i++) {
    await remote.drive(alice.key).ready()
  }

  // @ts-ignore
  t.is(remote.corestore._findingPeersCount, 1)

  await remote.swarm.flush()

  // @ts-ignore
  t.is(remote.corestore._findingPeersCount, 0)

  const discovery = remote.swarm._discovery.get(b4a.toString(drive.discoveryKey, 'hex'))
  // @ts-ignore
  t.is(discovery._sessions.length, 1)
  t.is(discovery?._clientSessions, 1)
  t.is(discovery?._serverSessions, 0)
  t.ok(discovery?.isClient)
  t.absent(discovery?.isServer)

  await remote.close()
  await sdk.close()
})

test.solo('drive - get from local if offline', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', c.encode(c.json, profile))

  await sdk.close()

  // other side
  const remote = new SDK({ ...testnet, storage: RAM })
  const clone = remote.drive(drive.key)

  const buf = await clone.get('/profile.json')
  const resolved = buf && c.decode(c.json, buf)

  t.alike(resolved, profile)

  await sdk.close()
  await remote.close()
})
