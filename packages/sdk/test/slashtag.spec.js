import { expect } from 'aegir/utils/chai.js'
import { Slashtag } from '../src/index.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk (opts = {}) {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe('slashtag', () => {
  it('should create a slashtag instance with a writable drive', async () => {
    const alice = await sdk()

    const slashtag = await Slashtag.init({
      name: 'drive for bob',
      sdk: alice
    })

    expect(slashtag.key.length).to.eql(32)
    expect(slashtag.key).to.eql(slashtag.drive.key)

    await alice.close()
  })

  it('should create a remote read-only slashtag from a url', async () => {
    const alice = await sdk()
    const slashtag = await Slashtag.init({
      name: 'drive for bob',
      sdk: alice
    })

    const content = b4a.from('hello world')
    await slashtag.drive.write('/foo.txt', content)

    const bob = await sdk()
    const clone = await Slashtag.init({
      url: slashtag.url,
      sdk: alice
    })

    expect(clone.key).to.eql(slashtag.key)

    const read = await clone.drive.read('/foo.txt')
    expect(read).to.eql(content)

    await alice.close()
    await bob.close()
  })

  describe.only('connection', () => {
    it('should listen, connect and exchange data', async () => {
      const sdkA = await sdk()
      const serverSlashtag = await sdkA.slashtag({ name: 'server' })

      const serverGotData = new Promise((resolve) => {
        serverSlashtag.on('connection', (socket, peerInfo) => {
          socket.on('data', (data) => {
            if (b4a.equals(data, b4a.from('ping'))) {
              socket.write(b4a.from('pong'))
              resolve(true)
            }
          })
        })
      })

      await serverSlashtag.listen()

      const sdkB = await sdk()
      const clientSlashtag = await sdkB.slashtag({ name: 'client' })

      const socket = await clientSlashtag.connect(serverSlashtag.key)

      const clientGotData = new Promise((resolve) => {
        socket.on('data', (data) => {
          if (b4a.equals(data, b4a.from('pong'))) {
            resolve(true)
          }
        })
      })

      socket.write(b4a.from('ping'))

      expect(await serverGotData).to.be.true('server got ping')
      expect(await clientGotData).to.be.true('client got pong')

      await sdkA.close()
      await sdkB.close()
    })

    it('should be able to replicate hypercores over a direct connection', async () => {
      const sdkA = await sdk()
      const alice = await sdkA.slashtag({ name: 'alice' })
      await alice.listen()

      const core = await sdkA.store.get({ name: 'foo' })
      await core.ready()
      await alice.swarm
        .join(core.discoveryKey, { server: true, client: false })
        .flushed()

      await core.append([b4a.from('hello'), b4a.from('world')])

      const sdkB = await sdk()
      const bob = await sdkB.slashtag({ name: 'alice' })

      const clone = await sdkB.store.get({ key: core.key })
      await clone.ready()

      bob.swarm.join(clone.discoveryKey, { server: false, client: true })

      const socket = await bob.connect(alice.key)

      // TODO update after updating the corestore with core.findingPeers()
      await bob.swarm.flush()
      await clone.update()

      expect(clone.length).to.equal(2)
      expect(await clone.get(0)).to.eql(b4a.from('hello'))
      expect(await clone.get(1)).to.eql(b4a.from('world'))

      await sdkA.close()
      await sdkB.close()
    })
  })
})
