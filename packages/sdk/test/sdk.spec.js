import { expect } from 'aegir/utils/chai.js'
import { sdk } from './helpers/setup-sdk.js'
import b4a from 'b4a'

describe('SDK', () => {
  describe('keys', () => {
    it('should generate slashtag keyPair from a primaryKey and a name', async () => {
      const primaryKey = b4a.from('a'.repeat(32), 'hex')
      const sdkA = await sdk({ primaryKey })
      const keyPair = sdkA.createKeyPair('foo')

      expect(keyPair.publicKey.length).to.equal(32)
      expect(keyPair.secretKey.length).to.equal(64)

      expect(keyPair.publicKey).to.eql(
        b4a.from(
          'b478b4e8f3ee07558e7756d421a3d2584b9cae2ec6bec09225138ed45f411916',
          'hex'
        )
      )

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

      expect(err.message).to.eql('Missing keyPair or key')

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
