import { expect } from 'aegir/utils/chai.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk () {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe('SDK', () => {
  describe('keys', () => {
    it('should generate keyPair from a name', async () => {
      const sdkA = await sdk()

      const keyPair = sdkA.keys.generateKeyPair('foo')

      expect(keyPair.publicKey.length).to.equal(32)
      expect(keyPair.secretKey.length).to.equal(64)

      sdkA.close()
    })

    it('should generate a keypair with a custom KeyManager', async () => {
      const sdkA = await sdk()

      const keyPair = sdkA.keys.generateKeyPair('foo')

      expect(keyPair.publicKey.length).to.equal(32)
      expect(keyPair.secretKey.length).to.equal(64)

      const namespacedKeys = sdkA.keys.namespace('namespaced')
      const namespacedKeyPair = namespacedKeys.generateKeyPair('foo')

      expect(namespacedKeyPair.publicKey.length).to.equal(32)
      expect(namespacedKeyPair.secretKey.length).to.equal(64)

      expect(namespacedKeyPair.publicKey).to.not.eql(keyPair.publicKey)
      expect(namespacedKeyPair.secretKey).to.not.eql(keyPair.publicKey)

      sdkA.close()
    })
  })

  describe('slashtags', () => {
    it('should create slashtag and close it on sdk.close()', async () => {
      const sdkA = await sdk()

      const alice = sdkA.slashtag({ name: 'alice' })
      const bob = sdkA.slashtag({ name: 'bob' })

      const keys = []

      for (const key of sdkA.slashtags.keys()) {
        keys.push(b4a.toString(key))
      }

      expect(keys.length).to.eql(2)
      expect(keys.includes(b4a.toString(alice.key))).to.be.true()
      expect(keys.includes(b4a.toString(bob.key))).to.be.true()

      sdkA.close()
    })

    it('should not create an already existing writable slashtag', async () => {
      const sdkA = await sdk()

      const alice = sdkA.slashtag({ name: 'alice' })
      sdkA.slashtag({ name: 'alice' })
      sdkA.slashtag({ name: 'alice' })

      const keys = []

      for (const key of sdkA.slashtags.keys()) {
        keys.push(b4a.toString(key))
      }

      expect(keys.length).to.eql(1)
      expect(keys.includes(b4a.toString(alice.key))).to.be.true()

      sdkA.close()
    })
  })

  describe('utilities', () => {
    it('should be able to retrieve a channel from a connection', async () => {
      class Foo {
        constructor (slashtag) {
          this.slashtag = slashtag
          this.options = {
            protocol: 'foo',
            messages: [
              {
                onmessage (message) {}
              }
            ]
          }
        }

        listen () {
          return this.slashtag.listen()
        }

        async request (publicKey) {
          const connection = await this.slashtag.connect(publicKey)
          const channel = connection.userData.channels.get(
            this.options.protocol
          )
          channel.messages[0].send('foo')
        }
      }

      const sdkA = await sdk()
      const alice = sdkA.slashtag({ name: 'alice' })
      const AliceFoo = alice.registerProtocol(Foo)

      await AliceFoo.listen()

      // ===

      const sdkB = await sdk()
      const bob = sdkB.slashtag({ name: 'bob' })
      bob.registerProtocol(Foo)

      const connection = await bob.connect(alice.key)

      const channel = SDK.getChannel(connection, 'foo')

      expect(channel.messages.length).to.eql(1)

      sdkA.close()
      sdkB.close()
    })
  })
})
