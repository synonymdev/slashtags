import { expect } from 'aegir/utils/chai.js'
import { sdk } from './helpers/setup-sdk.js'
import b4a from 'b4a'

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
    it('should throw an error if no key or url was given', async () => {
      const sdkA = await sdk()

      let err
      try {
        sdkA.slashtag({})
      } catch (error) {
        err = error
      }

      expect(err.message).to.eql('Missing keyPair, key or url')

      sdkA.close()
    })

    it('should not create a new instance of an already opened slashtag', async () => {
      const sdkA = await sdk()

      const alice = sdkA.slashtag({ name: 'alice' })
      await alice.ready()

      const aliceAgain = sdkA.slashtag({ name: 'alice' })
      expect(aliceAgain).to.eql(alice)

      sdkA.close()
    })

    it('should remove the slashtag on close', async () => {
      const sdkA = await sdk()

      const alice = sdkA.slashtag({ name: 'alice' })
      await alice.ready()

      expect(sdkA.slashtags.get(alice.key)).to.eql(alice)

      await alice.close()

      setTimeout(() => {
        expect(sdkA.slashtags.get(alice.key)).to.be.undefined()
      }, 1)

      return sdkA.close()
    })

    it('should create slashtag and close it on sdk.close()', async () => {
      const sdkA = await sdk()

      const alice = sdkA.slashtag({ name: 'alice' })
      const bob = sdkA.slashtag({ name: 'bob' })

      const keys = [...sdkA.slashtags.keys()].map((key) => b4a.toString(key))

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

      const keys = [...sdkA.slashtags.keys()].map((key) => b4a.toString(key))

      expect(keys.length).to.eql(1)
      expect(keys.includes(b4a.toString(alice.key))).to.be.true()

      sdkA.close()
    })
  })
})
