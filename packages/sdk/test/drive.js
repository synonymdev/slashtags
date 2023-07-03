const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const b4a = require('b4a')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')

const SDK = require('../index.js')
const { tmpdir } = require('./helpers/index.js')

const { Hyperdrive } = SDK

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
    .then(/** @param{*}b */(b) => b && JSON.parse(b4a.toString(b)))

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
  await t.exception(clone.getBlobs(), /.*/, "blind seeder can't reed private drive")
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

  t.alike(
    await clone.get('/foo')
      .then(/** @param{*}b */(b) => b && JSON.parse(b4a.toString(b))),
    contact
  )

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
      .then(/** @param{*}b */(b) => b && JSON.parse(b4a.toString(b))),
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

  await remote.close()

  await t.exception(() => clone.get('/profile.json'), /SESSION_CLOSED/)
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

  await t.exception(() => clone.get('/profile.json'), /SESSION_CLOSED/)
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
      .then(/** @param{*}b */(b) => b && JSON.parse(b4a.toString(b)))

    t.alike(resolved, profile)
    await remote.close()
  }

  const remote = new SDK({ ...testnet, storage: dir })
  remote.swarm.destroy()

  const clone = remote.drive(drive.key)
  await clone.ready()

  const resolved = await clone.get('/profile.json')
    .then(/** @param{*}b */(b) => b && JSON.parse(b4a.toString(b)))

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

  t.absent(sdk.corestore.closing)
  await sdk.close()
  t.ok(sdk.corestore.closing)
})

function noop () { }
