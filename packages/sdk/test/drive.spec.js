import b4a from 'b4a'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import Hyperswarm from 'hyperswarm'
import { DHT } from 'dht-universal'

import { expect } from 'aegir/utils/chai.js'
import { SlashDrive } from '../src/drive/index.js'
import { replicate } from './helpers/replicate.js'

describe('drive', () => {
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
      const drive = new SlashDrive({ name: 'foo', store })

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
  })

  describe('put and get', async () => {
    it('should throw an error on trying to put on a non-writable drive', async () => {
      const store = new Corestore(RAM)
      const dirve = new SlashDrive({
        key: (await store.createKeyPair('foo')).publicKey,
        store
      })
      await dirve.ready()

      let err
      try {
        await dirve.put('foo', b4a.from('hello'))
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Drive is not writable')
    })

    it('should write and read a public file', async () => {
      const drive = new SlashDrive({ name: 'foo', store: new Corestore(RAM) })
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

    it('should throw an error for missing content key in headers', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM)
      })
      await localDrive.ready()

      // Corrupt the headers
      await localDrive.headers.put('c', null)

      const remoteDrive = new SlashDrive({
        key: localDrive.key,
        store: new Corestore(RAM)
      })
      await remoteDrive.ready()

      await replicate(localDrive, remoteDrive)

      let err
      try {
        await remoteDrive.update()
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Missing content key in headers')
    })

    it('should return null for not-found objects', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM)
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
      const driveA = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM)
      })
      await driveA.ready()

      const list = await driveA.list('/foo/')

      expect(list.length).to.eql(0)
    })

    it('should list of objects with a given prefix', async () => {
      const driveA = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM)
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
      const driveA = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM)
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
    it('should create an encrypted drive', async () => {
      const store = new Corestore(RAM)

      const drive = new SlashDrive({
        name: 'foo',
        store,
        encrypted: true
      })
      await drive.update()

      expect(drive.encryptionKey).to.not.be.null()
      expect(drive.encryptionKey).to.eql(drive.metadata.feed.encryptionKey)
      expect(drive.content.feed.encryptionKey).to.eql(
        drive.metadata.feed.encryptionKey
      )
      expect(drive.content).to.not.be.undefined()

      const drive2 = new SlashDrive({
        name: 'foo',
        store,
        encrypted: true
      })
      await drive2.update()

      expect(drive.encryptionKey).to.eql(drive2.encryptionKey)
    })
  })

  describe('replicate', () => {
    it('should resolve a remote drive and get content of an object', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
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

      expect(remoteDrive.metadata.feed.length).to.be.greaterThan(0)

      const remoteContent = await remoteDrive.get('/profile.json')

      expect(remoteContent).to.eql(localContent)
    })

    it('should resolve remote encrypted drive', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM),
        encrypted: true
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

      expect(remoteDrive.metadata.feed.length).to.be.greaterThan(0)

      const remoteContent = await remoteDrive.get('/profile.json')

      expect(remoteContent).to.eql(localContent)
    })

    it('should throw an error for encrypted drives with no encryption key', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM),
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

      let err
      try {
        await remoteDrive.update()
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Encrypted or corrupt drive')
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

      const localDrive = new SlashDrive({
        name: 'foo',
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

      expect(remoteDrive.metadata.feed.length).to.be.greaterThan(0)

      const remoteContent = await remoteDrive.get('/profile.json')

      expect(remoteContent).to.eql(localContent)

      swarmA.destroy()
      swarmB.destroy()
    })
  })

  describe('events', () => {
    it('should emit update event', async () => {
      const localDrive = new SlashDrive({
        name: 'foo',
        store: new Corestore(RAM),
        encrypted: true
      })
      await localDrive.ready()

      const result = new Promise((resolve) => {
        localDrive.on('update', () => {
          resolve(true)
        })
      })

      await localDrive.put('foo', b4a.from('foo data'))

      expect(await result).to.be.true()
    })
  })
})
