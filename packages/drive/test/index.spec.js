import b4a from 'b4a'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import Hyperswarm from 'hyperswarm'
import { DHT } from 'dht-universal'

import { expect } from 'aegir/chai'
import { SlashDrive } from '../src/index.js'
import { replicate } from './helpers/replicate.js'

describe('initialization', () => {
  it('should create a drive with a keyPair and corestore instance', async () => {
    const store = new Corestore(RAM)
    const keyPair = await store.createKeyPair('foo')

    const drive = new SlashDrive({ keyPair, store })
    await drive.ready()

    expect(drive.key.length).to.eql(32)
  })

  it('should create a drive with a name and corestore instance', async () => {
    const store = new Corestore(RAM)
    const drive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })

    await drive.ready()

    expect(drive.key.length).to.eql(32)
  })

  it('should create a remote drive with a key and a corestore instance', async () => {
    const store = new Corestore(RAM)
    const keyPair = await store.createKeyPair('foo')
    const drive = new SlashDrive({ key: keyPair.publicKey, store })

    await drive.ready()

    expect(drive.key.length).to.eql(32)
  })

  it('should throw an error on missing parameters', async () => {
    const store = new Corestore(RAM)

    expect(() => new SlashDrive({ store })).to.throw('Missing keyPair, or key')
  })
})

describe('attributes', () => {
  it('should set attributes for writable drive on ready', async () => {
    const store = new Corestore(RAM)
    const keyPair = await store.createKeyPair('foo')

    const drive = new SlashDrive({ keyPair, store, encrypted: true })

    expect(() => drive.replicate(true)).to.not.throw(
      /.*/g,
      'Replication should be allowed before ready'
    )

    await drive.ready()

    expect(drive.key.length).to.eql(32)
    expect(drive.encryptionKey.length).to.eql(32)
    expect(drive.discoveryKey.length).to.eql(32)
    expect(drive.writable).to.be.true()
    expect(drive.readable).to.be.true()
  })

  it('should set attributes for remote drive after update', async () => {
    const store = new Corestore(RAM)
    const localDrive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store,
      encrypted: true
    })
    await localDrive.ready()

    const remoteDrive = new SlashDrive({
      key: localDrive.key,
      encryptionKey: localDrive.encryptionKey,
      store: new Corestore(RAM)
    })
    await remoteDrive.ready()

    await replicate(localDrive, remoteDrive)

    expect(remoteDrive.readable).to.be.false()

    await remoteDrive.update()

    expect(remoteDrive.key.length).to.eql(32)
    expect(remoteDrive.encryptionKey.length).to.eql(32)
    expect(remoteDrive.discoveryKey.length).to.eql(32)
    expect(remoteDrive.writable).to.be.false()
    expect(remoteDrive.readable).to.be.true()
  })

  describe('readable', () => {
    it('drives missing content key in headers should not be readable', async () => {
      const store = new Corestore(RAM)
      const localDrive = new SlashDrive({
        keyPair: await store.createKeyPair('foo'),
        store
      })

      // Corrupt the headers
      await localDrive.headersDB.put('c', null)

      const remoteDrive = new SlashDrive({
        key: localDrive.key,
        store: new Corestore(RAM)
      })

      await replicate(localDrive, remoteDrive)
      await remoteDrive.update()

      await expect(remoteDrive.readable).to.be.false()
    })

    it('remote drives that can not resolve the content core should not be readable', async () => {
      const store = new Corestore(RAM)
      const localDrive = new SlashDrive({
        keyPair: await store.createKeyPair('foo'),
        store,
        encrypted: true
      })
      await localDrive.ready()

      const remoteDrive = new SlashDrive({
        store: new Corestore(RAM),
        key: localDrive.key
      })
      await remoteDrive.ready()

      expect(remoteDrive.peers.length).to.equal(0)
      expect(remoteDrive.readable).to.be.false()
    })

    it('encrypted drives that can not be decrypted should not be readable', async () => {
      const store = new Corestore(RAM)
      const localDrive = new SlashDrive({
        keyPair: await store.createKeyPair('foo'),
        store,
        encrypted: true
      })
      await localDrive.ready()

      const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
      await localDrive.put('/profile.json', localContent)

      const remoteDrive = new SlashDrive({
        store: new Corestore(RAM),
        key: localDrive.key
      })
      await remoteDrive.ready()

      await replicate(localDrive, remoteDrive)
      await remoteDrive.update()

      expect(remoteDrive.readable).to.be.false()
    })
  })
})

describe('put and get', async () => {
  it('should throw an error on trying to put on a non-writable drive', async () => {
    const store = new Corestore(RAM)
    const drive = new SlashDrive({
      key: (await store.createKeyPair('foo')).publicKey,
      store
    })
    await drive.ready()

    await expect(
      drive.put('foo', b4a.from('hello'))
    ).to.eventually.be.rejectedWith('Drive is not writable')
  })

  it('should write and read a public file', async () => {
    const store = new Corestore(RAM)
    const drive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })
    await drive.ready()

    const content = b4a.from(JSON.stringify({ foo: 'bar' }))
    const other = b4a.from(JSON.stringify({ foo: 'zar' }))

    await drive.put('/profile.json', content)
    await drive.put('/other.json', other)

    const read = await drive.get('/profile.json')
    const readOther = await drive.get('/other.json')

    expect(read).to.eql(content)
    expect(readOther).to.eql(other)
  })

  it('should return null for not-found objects', async () => {
    const store = new Corestore(RAM)
    const localDrive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })
    await localDrive.ready()

    await localDrive.put(
      '/not-profile.json',
      b4a.from(JSON.stringify({ foo: 'bar' }))
    )

    const remoteDrive = new SlashDrive({
      key: localDrive.key,
      store: new Corestore(RAM)
    })
    await remoteDrive.ready()

    await replicate(localDrive, remoteDrive)

    await remoteDrive.update()

    const remoteContent = await remoteDrive.get('/profile.json')

    expect(remoteContent).to.eql(null)
  })
})

describe('list', () => {
  it('should return an empty list for non existent prefix', async () => {
    const store = new Corestore(RAM)
    const driveA = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })
    await driveA.ready()

    const list = await driveA.list('/foo/')

    expect(list.length).to.eql(0)
  })

  it('should list of objects with a given prefix', async () => {
    const store = new Corestore(RAM)
    const driveA = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })
    await driveA.ready()

    await driveA.put('/foo.txt', b4a.from('bar'))
    await driveA.put('/foo/bar.txt', b4a.from('bar'))
    await driveA.put('/foo/bar/zar.txt', b4a.from('bar'))
    await driveA.put('/foo/bara/zar.txt', b4a.from('bar'))

    expect(await driveA.list('/foo')).to.eql([
      { key: '/foo.txt', metadata: { contentLength: 3 } },
      { key: '/foo/bar.txt', metadata: { contentLength: 3 } },
      { key: '/foo/bar/zar.txt', metadata: { contentLength: 3 } },
      { key: '/foo/bara/zar.txt', metadata: { contentLength: 3 } }
    ])
    expect(await driveA.list('/foo/')).to.eql([
      { key: '/foo/bar.txt', metadata: { contentLength: 3 } },
      { key: '/foo/bar/zar.txt', metadata: { contentLength: 3 } },
      { key: '/foo/bara/zar.txt', metadata: { contentLength: 3 } }
    ])

    expect(await driveA.list('/foo/bar/')).to.eql([
      { key: '/foo/bar/zar.txt', metadata: { contentLength: 3 } }
    ])

    expect(await driveA.list('/foo/bar/zar.txt')).to.eql([
      { key: '/foo/bar/zar.txt', metadata: { contentLength: 3 } }
    ])
  })
})

describe('metadata', () => {
  it('default json encoding', async () => {
    const store = new Corestore(RAM)
    const driveA = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store
    })
    await driveA.ready()

    const metadata = {
      foo: 'bar',
      no: 123
    }

    await driveA.put('/foo.txt', b4a.from('bar'), {
      metadata
    })

    expect(await driveA.list('/foo.txt')).to.eql([
      {
        key: '/foo.txt',
        metadata: {
          contentLength: 3,
          ...metadata
        }
      }
    ])
  })
})

describe('encryption', () => {
  it('should create an encrypted drive with the same encryption key every time', async () => {
    const store = new Corestore(RAM)
    const drive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store: new Corestore(RAM),
      encrypted: true
    })
    await drive.ready()

    expect(drive.encryptionKey).to.not.be.null()
    expect(drive.encryptionKey).to.eql(drive.metadataDB.feed.encryptionKey)
    expect(drive.content.core.encryptionKey).to.eql(
      drive.metadataDB.feed.encryptionKey
    )
    expect(drive.content).to.not.be.undefined()

    const drive2 = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store,
      encrypted: true
    })
    await drive2.update()

    expect(drive.encryptionKey).to.eql(drive2.encryptionKey)
  })
})

describe('replicate', () => {
  it('should resolve a remote drive and get content of an object', async () => {
    const store = new Corestore(RAM)
    const localDrive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store: new Corestore(RAM)
    })
    await localDrive.ready()

    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.put('/profile.json', localContent)

    const remoteDrive = new SlashDrive({
      key: localDrive.key,
      store: new Corestore(RAM)
    })
    await remoteDrive.ready()

    await replicate(localDrive, remoteDrive)

    await remoteDrive.update()

    expect(remoteDrive.readable).to.be.true()

    const remoteContent = await remoteDrive.get('/profile.json')

    expect(remoteContent).to.eql(localContent)
  })

  it('should resolve remote encrypted drive', async () => {
    const store = new Corestore(RAM)
    const localDrive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store: new Corestore(RAM)
    })
    await localDrive.ready()

    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.put('/profile.json', localContent)

    const remoteDrive = new SlashDrive({
      store: new Corestore(RAM),
      key: localDrive.key,
      encryptionKey: localDrive.encryptionKey
    })
    await remoteDrive.ready()

    await replicate(localDrive, remoteDrive)

    await remoteDrive.update()

    expect(remoteDrive.readable).to.be.true()

    const remoteContent = await remoteDrive.get('/profile.json')

    expect(remoteContent).to.eql(localContent)
  })
})

describe('discovery', () => {
  async function swarm () {
    const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env
    const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP)

    return new Hyperswarm({
      dht: await DHT.create({
        bootstrap,
        relays: [RELAY_URL]
      })
    })
  }

  it('should allow discovery and replication using Hyperswarm', async () => {
    const swarmA = await swarm()

    const store = new Corestore(RAM)
    const localDrive = new SlashDrive({
      keyPair: await store.createKeyPair('foo'),
      store: new Corestore(RAM)
    })
    await localDrive.ready()

    swarmA.on('connection', (conn) => localDrive.replicate(conn))
    swarmA.join(localDrive.discoveryKey)

    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.put('/profile.json', localContent)

    const swarmB = await swarm()

    const remoteDrive = new SlashDrive({
      key: localDrive.key,
      store: new Corestore(RAM)
    })
    await remoteDrive.ready()

    swarmB.on('connection', (conn) => remoteDrive.replicate(conn))
    const done = await remoteDrive.findingPeers()
    swarmB.join(remoteDrive.discoveryKey)
    swarmB.flush().then(done, done)

    await remoteDrive.update()

    expect(remoteDrive.readable).to.be.true()

    const remoteContent = await remoteDrive.get('/profile.json')

    expect(remoteContent).to.eql(localContent)

    swarmA.destroy()
    swarmB.destroy()
  })
})

describe('events', () => {
  describe('update', () => {
    it('should emit update event', async () => {
      const store = new Corestore(RAM)
      const localDrive = new SlashDrive({
        keyPair: await store.createKeyPair('foo'),
        store,
        encrypted: true
      })
      await localDrive.ready()

      const result = new Promise((resolve) => {
        localDrive.on('update', (data) => {
          resolve(data)
        })
      })

      await localDrive.put('foo', b4a.from('foo data'))

      expect(await result).to.eql({
        key: 'foo',
        seq: 3,
        type: 'put'
      })
    })

    it('should emit update event when a remote drives get updates', async () => {
      const originStore = new Corestore(RAM)
      const origin = new SlashDrive({
        keyPair: await originStore.createKeyPair('foo'),
        store: originStore,
        encrypted: true
      })
      await origin.ready()

      const clone = new SlashDrive({
        key: origin.key,
        store: new Corestore(RAM),
        encryptionKey: origin.encryptionKey
      })
      await replicate(origin, clone)
      await clone.update()

      const result = new Promise((resolve) => {
        clone.on('update', (data) => {
          resolve(data)
        })
      })

      await origin.put('foo', b4a.from('foo data'))

      expect(await result).to.eql({
        key: 'foo',
        seq: 3,
        type: 'put'
      })
    })

    // TODO: test again emitting update event for multiple encrypted remote drives
    it.skip('should allow emitting updates for multiple clones', async () => {
      const originStore = new Corestore(RAM)
      const origin = new SlashDrive({
        keyPair: await originStore.createKeyPair('foo'),
        store: originStore,
        encrypted: true
      })
      await origin.ready()

      const clone = new SlashDrive({
        key: origin.key,
        store: new Corestore(RAM),
        encryptionKey: origin.encryptionKey
      })
      clone.name = 'clone1'
      await replicate(origin, clone)
      await clone.update()

      const result = new Promise((resolve) => {
        clone.on('update', (data) => {
          console.log('update 1', data)
          resolve(data)
        })
      })

      const clone2 = new SlashDrive({
        key: origin.key,
        store: clone.store,
        encryptionKey: origin.encryptionKey
      })
      await clone2.ready()
      await clone2.update()
      console.log(clone2)
      console.log({
        clone: clone.encryptionKey,
        clone2: clone2.encryptionKey
      })

      const result2 = new Promise((resolve) => {
        clone2.on('update', (data) => {
          console.log('update 2', data)
          resolve(data)
        })
      })

      await origin.put('foo', b4a.from('foo data'))

      expect(await result).to.eql({
        key: 'foo',
        seq: 3,
        type: 'put'
      })

      expect(await result2).to.eql({
        key: 'foo',
        seq: 3,
        type: 'put'
      })
    })
  })
})
