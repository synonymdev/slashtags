import test from 'brittle'
import createTestnet from '@hyperswarm/testnet'
import b4a from 'b4a'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'

import SDK, { Hyperdrive } from '../index.js'
import { tmpdir } from './helpers/index.js'

test('drive - resolve public drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))

  // other side
  const remote = new SDK({ ...testnet, storage: tmpdir() })
  const clone = remote.drive(drive.key)

  const resolved = await clone.get('/profile.json')
    .then(b => b && JSON.parse(b4a.toString(b)))

  t.alike(resolved, profile)

  await sdk.close()
  await remote.close()
})

test('drive - blind seeder resolve private drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get('contacts')
  await sdk.swarm.flush()

  const contact = { name: 'alice' }
  await drive.put('/foo', b4a.from(JSON.stringify(contact)))

  // other side
  const seeder = new Hyperswarm(testnet)

  const clone = new Hyperdrive(new Corestore(tmpdir()), drive.key)

  const s = clone.corestore.replicate(true)
  s.pipe(drive.corestore.replicate(false)).pipe(s)

  await clone.update()
  await t.exception(clone.get('/foo'), /.*/, "blind seeder can't reed private drive")
  t.is(clone.core.length, 2, 'still can replicate')

  await sdk.close()
  await seeder.destroy()
})

test('drive - read encrypted drives', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get('contacts')
  await drive.ready()
  sdk.join(drive.discoveryKey)?.flushed()

  const contact = { name: 'alice' }
  await drive.put('/foo', b4a.from(JSON.stringify(contact)))

  const key = drive.key
  const encryptionKey = drive.core.encryptionKey

  // other side
  const reader = new SDK({ ...testnet, storage: tmpdir() })

  const clone = reader.drive(key, { encryptionKey })
  const done = clone.findingPeers()
  reader.swarm.flush().then(done, done)

  await clone.update()

  t.alike(await clone.get('/foo').then(buf => buf && JSON.parse(buf.toString())), contact)

  await sdk.close()
  await reader.close()
})

test('drive - internal hyperdrive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))

  const readonly = sdk.drive(alice.key)

  t.alike(
    await readonly.get('/profile.json')
      .then(b => b && JSON.parse(b4a.toString(b))),
    profile,
    'correctly open a readonly drive session of local drive'
  )

  await readonly.close()

  const discovery = sdk.swarm.status(drive.discoveryKey)
  t.is(discovery?._sessions.length, 1)
  t.is(discovery?._clientSessions, 1)
  t.is(discovery?._serverSessions, 1)
  t.ok(discovery?.isClient)
  t.ok(discovery?.isServer)

  await sdk.close()
})

test('drive - close discovery sessions on closing drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const remote = new SDK({ ...testnet, storage: tmpdir() })
  const clone = remote.drive(b4a.from('69b04ea6e3b62245048a8efe8c17c6affb91e07ea1e28c911c2acdfd4d851f5c', 'hex'))
  await clone.update()

  t.is(clone.core.peers.length, 0)

  const sdk = new SDK({ ...testnet, storage: tmpdir(), primaryKey: b4a.from('a'.repeat(64), 'hex') })
  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await drive.put('/foo', b4a.from('bar'))

  await sdk.swarm.flush()

  for (let i = 0; i < 10; i++) {
    const driveSession = remote.drive(alice.key)
    await driveSession.close()
  }

  const discovery = remote.swarm.status(drive.discoveryKey)
  t.is(discovery?._sessions.length, 1, 'closed all discovery sessions after closing drives sessions')

  await remote.close()
  await sdk.close()
})

test('read only created first', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const dir = tmpdir()
  let key
  let primaryKey

  {
    const sdk = new SDK({ ...testnet, storage: dir })
    const alice = sdk.slashtag()
    const writable = alice.drivestore.get()
    await writable.put('/profile.json', b4a.from(''))
    key = writable.key
    primaryKey = sdk.primaryKey

    await sdk.close()
    // TODO move this to sdk.close?
    await sdk.corestore.close()
  }

  const sdk = new SDK({ ...testnet, storage: dir, primaryKey })
  const readable = sdk.drive(key)
  await readable.ready()

  const writable = sdk.slashtag().drivestore.get()
  await writable.ready()
  t.ok(writable.core.writable)
  t.ok(writable.blobs?.core.writable)
  await writable.put('/profile.json', b4a.from('new'))
  t.alike(await writable.get('/profile.json'), b4a.from('new'))

  t.alike(writable.key, readable.key)
  t.alike(await readable.get('/profile.json'), await writable.get('/profile.json'))

  await sdk.close()
})

test('replicate on closed corestore', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))

  // other side
  const remote = new SDK({ ...testnet, storage: tmpdir() })
  const clone = remote.drive(drive.key)

  remote.close()

  await t.exception(() => clone.get('/profile.json'), /The corestore is closed/)
  await clone.get('/profile.json').catch(noop)
  t.pass('catch caught error on clone.get()')

  await sdk.close()
  await remote.close()
})

test('replicate after swarm destroyed', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))

  // other side
  const remote = new SDK({ ...testnet, storage: tmpdir() })
  const clone = remote.drive(drive.key)

  await remote.close()

  await t.exception(() => clone.get('/profile.json'))
  await clone.get('/profile.json').catch(noop)
  t.pass('catch caught error on clone.get()')

  await sdk.close()
  await remote.close()
})

test('swarm destroying before reading saved remote drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: tmpdir() })

  const alice = sdk.slashtag('alice')
  const drive = alice.drivestore.get()
  await sdk.swarm.flush()

  const profile = { name: 'alice' }
  await drive.put('/profile.json', b4a.from(JSON.stringify(profile)))

  // other side
  const dir = tmpdir()
  {
    const remote = new SDK({ ...testnet, storage: dir })
    const clone = remote.drive(drive.key)
    await clone.ready()

    const resolved = await clone.get('/profile.json')
      .then(b => b && JSON.parse(b4a.toString(b)))

    t.alike(resolved, profile)
    await remote.close()
  }

  const remote = new SDK({ ...testnet, storage: dir })
  remote.swarm.destroy()

  const clone = remote.drive(drive.key)
  await clone.ready()

  const resolved = await clone.get('/profile.json')
    .then(b => b && JSON.parse(b4a.toString(b)))

  t.alike(resolved, profile)

  t.pass('should not hang forever')

  await sdk.close()
  await remote.close()
})

test('swarm destroying before reading local drive', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const dir = tmpdir()
  let primaryKey
  {
    const remote = new SDK({ ...testnet, storage: dir })
    const drive = remote.slashtag().drivestore.get()
    await drive.ready()

    primaryKey = remote.primaryKey

    await drive.put('/profile.json', b4a.from('..'))
    await remote.close()
  }

  const remote = new SDK({ ...testnet, storage: dir, primaryKey })
  remote.swarm.destroy()

  const drive = remote.slashtag().drivestore.get()
  await drive.ready()

  const buf = await drive.get('/profile.json')

  t.ok(buf)

  t.pass('should not hang forever')

  await remote.close()
})

test('closing drive does not close corestore', async (t) => {
  const sdk = new SDK({ storage: tmpdir() })

  const drive = sdk.drive(b4a.alloc(32).fill('foo'))
  await drive.ready()
  await drive.close()

  t.absent(sdk.corestore._closing)
  await sdk.close()
  t.ok(sdk.corestore._closing)
})

function noop () {}
