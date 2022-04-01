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

      await sdkA.close()
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

      await sdkA.close()
    })
  })

  describe('slashtags', () => {
    it('should create slashtag and close it on sdk.close()', async () => {
      const sdkA = await sdk()

      const alice = await sdkA.slashtag({ name: 'alice' })
      const bob = await sdkA.slashtag({ name: 'bob' })

      const keys = []

      for (const key of sdkA.slashtags.keys()) {
        keys.push(b4a.toString(key))
      }

      expect(keys.length).to.eql(2)
      expect(keys.includes(b4a.toString(alice.key))).to.be.true()
      expect(keys.includes(b4a.toString(bob.key))).to.be.true()

      await sdkA.close()
    })

    it('should not create an already existing writable slashtag', async () => {
      const sdkA = await sdk()

      const alice = await sdkA.slashtag({ name: 'alice' })
      await sdkA.slashtag({ name: 'alice' })
      await sdkA.slashtag({ keyPair: alice.keyPair })

      const keys = []

      for (const key of sdkA.slashtags.keys()) {
        keys.push(b4a.toString(key))
      }

      expect(keys.length).to.eql(1)
      expect(keys.includes(b4a.toString(alice.key))).to.be.true()

      await sdkA.close()
    })

    // TODO test read only Slashtag
  })
})
