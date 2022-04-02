import { expect } from 'aegir/utils/chai.js'
import { Slashtag } from '../src/index.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'
import c from 'compact-encoding'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk (opts = {}) {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe('slashtag', () => {
  it.skip('should create a slashtag instance with a writable drive', async () => {
    const alice = await sdk()

    const slashtag = await Slashtag.init({
      name: 'drive for bob',
      sdk: alice
    })

    expect(slashtag.key.length).to.eql(32)
    expect(slashtag.key).to.eql(slashtag.drive.key)

    await alice.close()
  })

  it.skip('should create a remote read-only slashtag from a url', async () => {
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

  describe('connection', () => {
    it('should listen, connect and exchange data', async () => {
      const sdkA = await sdk()
      const serverSlashtag = await sdkA.slashtag({ name: 'server' })

      const serverGotData = new Promise((resolve) => {
        serverSlashtag.on('connection', (socket, peerInfo) => {
          // eslint-disable-next-line
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

    it('should replicate hypercores over a direct connection', async () => {
      const sdkA = await sdk()
      const alice = await sdkA.slashtag({ name: 'alice' })
      await alice.listen()

      const core = await sdkA.store.get({ name: 'foo' })
      await core.ready()

      await core.append([b4a.from('hello'), b4a.from('world')])

      const sdkB = await sdk()
      const bob = await sdkB.slashtag({ name: 'alice' })

      const clone = await sdkB.store.get({ key: core.key })
      await clone.ready()

      await clone.update()
      expect(clone.length).to.equal(0)

      await bob.connect(alice.key)
      await clone.update()

      expect(clone.length).to.equal(2)
      expect(await clone.get(0)).to.eql(b4a.from('hello'))
      expect(await clone.get(1)).to.eql(b4a.from('world'))

      await sdkA.close()
      await sdkB.close()
    })

    it('should register and multiplex multiple protocol over the same connection', async () => {
      class Foo {
        constructor (slashtag) {
          this.slashtag = slashtag
          this.messages = []

          this.options = {
            protocol: 'foo',
            messages: [
              {
                encoding: c.string,
                onmessage (message, channel) {
                  channel.slashtag.emit('foo', message)
                }
              }
            ]
          }
        }

        listen () {
          return this.slashtag.listen()
        }

        async request (publicKey) {
          await this.slashtag.connect(publicKey)
          this.messages[0].send('foo')
        }
      }

      class Bar {
        constructor (slashtag) {
          this.slashtag = slashtag
          this.messages = []
          this.options = {
            protocol: 'bar',
            messages: [
              {
                encoding: c.string,
                onmessage (message, channel) {
                  channel.slashtag.emit('bar', message)
                }
              }
            ]
          }
        }

        listen () {
          return this.slashtag.listen()
        }

        async request (publicKey) {
          await this.slashtag.connect(publicKey)
          this.messages[0].send('bar')
        }
      }

      const sdkA = await sdk()
      const alice = await sdkA.slashtag({ name: 'alice' })
      const AliceFoo = alice.registerProtocol(Foo)
      const AliceBar = alice.registerProtocol(Bar)

      await AliceFoo.listen()
      await AliceBar.listen()

      // ===

      const sdkB = await sdk()
      const bob = await sdkB.slashtag({ name: 'bob' })

      const BobFoo = bob.registerProtocol(Foo)
      const BobBar = bob.registerProtocol(Bar)

      const foo = new Promise((resolve) => alice.on('foo', resolve))
      const bar = new Promise((resolve) => alice.on('bar', resolve))

      BobFoo.request(alice.key)
      BobBar.request(alice.key)
      expect(await foo).to.eql('foo')
      expect(await bar).to.eql('bar')

      await sdkA.close()
      await sdkB.close()
    })
  })
})
