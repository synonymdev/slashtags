import { expect } from 'aegir/utils/chai.js'
import { SlashDrive } from '../src/index.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'
import Hyperswarm from 'hyperswarm'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk () {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe('drive', () => {
  it('should create a Slashdrive, write and read a blob of data', async () => {
    const sdkA = await sdk()
    const keyPair = sdkA.generateKeyPair('foo')

    const drive = new SlashDrive({ keyPair, sdk: sdkA })
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

  it('should resolve a remote drive', async () => {
    const sdkA = await sdk()
    const keyPair = sdkA.generateKeyPair('foo')

    const swarmA = new Hyperswarm({ dht: sdkA.dht })
    swarmA.on('connection', (socket) => sdkA.store.replicate(socket))

    const localDrive = new SlashDrive({ sdk: sdkA, keyPair, swarm: swarmA })
    await localDrive.ready()

    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.write('/profile.json', localContent)

    const sdkB = await sdk()

    const swarmB = new Hyperswarm({ dht: sdkB.dht })
    swarmB.on('connection', (socket) => sdkB.store.replicate(socket))

    const remoteDrive = new SlashDrive({
      sdk: sdkB,
      key: localDrive.key,
      swarm: swarmB
    })
    await remoteDrive.ready()

    const remoteContent = await remoteDrive.read('/profile.json')

    expect(remoteContent).to.eql(localContent)

    sdkA.close()
    sdkB.close()
    swarmA.destroy()
    swarmB.destroy()
  })

  it('should throw an error on drive.ready() for unresolvable SlashDrive', async () => {
    const sdkB = await sdk()
    const swarm = new Hyperswarm({ dht: sdkB.dht })
    const remoteDrive = new SlashDrive({
      sdk: sdkB,
      key: sdkB.generateKeyPair('foo').publicKey,
      swarm
    })

    let err

    try {
      await remoteDrive.ready()
    } catch (error) {
      err = error
    }

    expect(err).to.be.an('error')
    expect(err.message).to.equal('Could not resolve remote drive')

    sdkB.close()
    swarm.destroy()
  })

  it('should return null for not-found files', async () => {
    const sdkA = await sdk()
    const swarmA = new Hyperswarm({ dht: sdkA.dht })
    swarmA.on('connection', (socket) => sdkA.store.replicate(socket))

    const localDrive = new SlashDrive({
      sdk: sdkA,
      keyPair: sdkA.generateKeyPair('foo'),
      swarm: swarmA
    })
    await localDrive.ready()

    const sdkB = await sdk()
    const swarmB = new Hyperswarm({ dht: sdkB.dht })
    swarmB.on('connection', (socket) => sdkB.store.replicate(socket))
    const remoteDrive = new SlashDrive({
      sdk: sdkB,
      key: localDrive.key,
      swarm: swarmB
    })
    await remoteDrive.ready()

    const remoteContent = await remoteDrive.read('/profile.json')

    expect(remoteContent).to.eql(null)

    sdkA.close()
    sdkB.close()
    swarmA.destroy()
    swarmB.destroy()
  })
})
