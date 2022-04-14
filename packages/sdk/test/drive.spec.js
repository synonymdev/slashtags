import { expect } from 'aegir/utils/chai.js'
import { SlashDrive } from '../src/drive/index.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'
import Hyperswarm from 'hyperswarm'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk (opts) {
  return SDK.init({
    bootstrap,
    relays: [RELAY_URL],
    persistent: false,
    ...opts
  })
}

describe('drive', () => {
  it('should namespace additional Hypercores core with the drive key', async () => {
    const sdkA = await sdk()

    const driveA = new SlashDrive({
      keyPair: sdkA.generateKeyPair('foo'),
      store: sdkA.store,
      keys: sdkA.keys
    })
    await driveA.ready()
    await driveA.write('/foo', b4a.from('bar'))

    const driveB = new SlashDrive({
      keyPair: sdkA.generateKeyPair('bar'),
      store: sdkA.store,
      keys: sdkA.keys
    })
    await driveB.ready()
    await driveB.write('/foo', b4a.from('bar'))

    const driveAClone = new SlashDrive({
      keyPair: sdkA.generateKeyPair('foo'),
      store: sdkA.store,
      keys: sdkA.keys
    })
    await driveAClone.ready()
    await driveAClone.read('/foo')

    expect(driveB.content.feed.key).to.not.eql(driveA.content.feed.key)
    expect(driveAClone.content.feed.key).to.eql(driveA.content.feed.key)

    sdkA.close()
  })

  it('should resolve a remote drive and read a file', async () => {
    const sdkA = await sdk({
      persistent: true,
      storage: './test/.store/drive',
      primaryKey: b4a.from('a'.repeat(64))
    })

    const swarmA = new Hyperswarm({ dht: sdkA.dht })
    swarmA.on('connection', (socket) => sdkA.store.replicate(socket))

    const keyPair = sdkA.generateKeyPair('foo')
    const localDrive = new SlashDrive({
      store: sdkA.store,
      keys: sdkA.keys,
      keyPair
    })
    await localDrive.ready()
    await swarmA.join(localDrive.discoveryKey).flushed()

    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.write('/profile.json', localContent)

    const sdkB = await sdk()

    const swarmB = new Hyperswarm({ dht: sdkB.dht })
    swarmB.on('connection', (socket) => sdkB.store.replicate(socket))

    const remoteDrive = new SlashDrive({
      store: sdkB.store,
      keys: sdkB.keys,
      key: localDrive.key
    })
    await remoteDrive.ready()
    swarmB.join(remoteDrive.discoveryKey)

    const done = remoteDrive.findingPeers()
    swarmB.flush().then(done, done)
    await remoteDrive.update()

    expect(remoteDrive.metadata.feed.length).to.be.greaterThan(0)

    const remoteContent = await remoteDrive.read('/profile.json')

    expect(remoteContent).to.eql(localContent)

    sdkA.close()
    sdkB.close()
    swarmA.destroy()
    swarmB.destroy()
  })

  it('should create an encrypted drive', async () => {
    const sdkA = await sdk()

    const encryptionKey = sdkA.generateKeyPair('bar').secretKey

    const drive = new SlashDrive({
      keyPair: sdkA.generateKeyPair('foo'),
      store: sdkA.store,
      keys: sdkA.keys,
      encryptionKey
    })
    await drive.ready()

    await drive.write('/foo', b4a.from('bar'))

    expect(drive.metadata.feed.encryptionKey).to.eql(encryptionKey)
    expect(drive.content.feed.encryptionKey).to.eql(encryptionKey)

    sdkA.close()
  })

  describe('read and write', async () => {
    it('should write and read a public file', async () => {
      const sdkA = await sdk()
      const keyPair = sdkA.generateKeyPair('foo')

      const drive = new SlashDrive({
        keyPair,
        store: sdkA.store,
        keys: sdkA.keys
      })
      await drive.ready()

      const content = b4a.from(JSON.stringify({ foo: 'bar' }))
      const other = b4a.from(JSON.stringify({ foo: 'zar' }))

      await drive.write('/profile.json', content)
      await drive.write('/other.json', other)

      const read = await drive.read('/profile.json')
      const readOther = await drive.read('/other.json')

      expect(read).to.eql(content)
      expect(readOther).to.eql(other)

      sdkA.close()
    })

    it('should throw an error for missing content key in headers', async () => {
      const sdkA = await sdk()
      const swarmA = new Hyperswarm({ dht: sdkA.dht })
      swarmA.on('connection', (socket) => sdkA.store.replicate(socket))

      const localDrive = new SlashDrive({
        store: sdkA.store,
        keys: sdkA.keys,
        keyPair: sdkA.generateKeyPair('foo')
      })
      await localDrive.ready()
      await swarmA.join(localDrive.discoveryKey).flushed()

      const sdkB = await sdk()
      const swarmB = new Hyperswarm({ dht: sdkB.dht })
      swarmB.on('connection', (socket) => sdkB.store.replicate(socket))
      const remoteDrive = new SlashDrive({
        store: sdkB.store,
        keys: sdkB.keys,
        key: localDrive.key
      })
      await remoteDrive.ready()
      swarmB.join(localDrive.discoveryKey)
      const done = remoteDrive.findingPeers()
      swarmB.flush().then(done, done)
      await remoteDrive.update()

      let err
      try {
        await remoteDrive.read('/profile.json')
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Missing content key in headers')

      sdkA.close()
      sdkB.close()
      swarmA.destroy()
      swarmB.destroy()
    })

    it('should return null for not-found files', async () => {
      const sdkA = await sdk()
      const swarmA = new Hyperswarm({ dht: sdkA.dht })
      swarmA.on('connection', (socket) => sdkA.store.replicate(socket))

      const localDrive = new SlashDrive({
        store: sdkA.store,
        keys: sdkA.keys,
        keyPair: sdkA.generateKeyPair('foo')
      })
      await localDrive.ready()

      await localDrive.write(
        '/not-profile.json',
        b4a.from(JSON.stringify({ foo: 'bar' }))
      )

      await swarmA.join(localDrive.discoveryKey).flushed()

      const sdkB = await sdk()
      const swarmB = new Hyperswarm({ dht: sdkB.dht })
      swarmB.on('connection', (socket) => sdkB.store.replicate(socket))
      const remoteDrive = new SlashDrive({
        store: sdkB.store,
        keys: sdkB.keys,
        key: localDrive.key
      })
      await remoteDrive.ready()
      swarmB.join(localDrive.discoveryKey)
      const done = remoteDrive.findingPeers()
      swarmB.flush().then(done, done)
      await remoteDrive.update()

      const remoteContent = await remoteDrive.read('/profile.json')

      expect(remoteContent).to.eql(null)

      sdkA.close()
      sdkB.close()
      swarmA.destroy()
      swarmB.destroy()
    })
  })

  describe('exists', () => {
    it('should return a boolean for the existence of a public file', async () => {
      const sdkA = await sdk()

      const driveA = new SlashDrive({
        keyPair: sdkA.generateKeyPair('foo'),
        store: sdkA.store,
        keys: sdkA.keys
      })
      await driveA.ready()
      await driveA.write('/foo', b4a.from('bar'))

      expect(await driveA.exists('/foo')).to.eql(true)
      expect(await driveA.exists('/bar')).to.eql(false)

      sdkA.close()
    })

    it('should return a boolean for the existence of a public directory', async () => {
      const sdkA = await sdk()

      const driveA = new SlashDrive({
        keyPair: sdkA.generateKeyPair('foo'),
        store: sdkA.store,
        keys: sdkA.keys
      })
      await driveA.ready()
      await driveA.write('/foo/bar.txt', b4a.from('bar'))

      expect(await driveA.exists('/foo/')).to.eql(true)
      expect(await driveA.exists('/foo/bar/')).to.eql(false)

      sdkA.close()
    })
  })

  describe('ls', () => {
    it('should throw an error for non directory path', async () => {
      const sdkA = await sdk()

      const driveA = new SlashDrive({
        keyPair: sdkA.generateKeyPair('foo'),
        store: sdkA.store,
        keys: sdkA.keys
      })
      await driveA.ready()

      let err

      try {
        await driveA.ls('/foo')
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Can not list a file')

      sdkA.close()
    })

    it('should throw an error for non existent path', async () => {
      const sdkA = await sdk()

      const driveA = new SlashDrive({
        keyPair: sdkA.generateKeyPair('foo'),
        store: sdkA.store,
        keys: sdkA.keys
      })
      await driveA.ready()

      let err

      try {
        await driveA.ls('/foo/')
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Directory does not exist')

      sdkA.close()
    })

    it('should list the content of a directory', async () => {
      const sdkA = await sdk()

      const driveA = new SlashDrive({
        keyPair: sdkA.generateKeyPair('foo'),
        store: sdkA.store,
        keys: sdkA.keys
      })
      await driveA.ready()

      await driveA.write('/foo.txt', b4a.from('bar'))
      await driveA.write('/foo/bar.txt', b4a.from('bar'))
      await driveA.write('/foo/bar/zar.txt', b4a.from('bar'))
      await driveA.write('/foo/bara/zar.txt', b4a.from('bar'))

      expect(await driveA.ls('/')).to.eql(['foo.txt', 'foo/'])
      expect(await driveA.ls('/foo/')).to.eql(['bar.txt', 'bar/', 'bara/'])
      expect(await driveA.ls('/foo/bar/')).to.eql(['zar.txt'])

      sdkA.close()
    })
  })
})
