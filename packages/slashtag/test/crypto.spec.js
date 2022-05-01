import b4a from 'b4a'
import sodium from 'sodium-universal'

import { expect } from 'aegir/utils/chai.js'
import { createKeyPair } from '../src/crypto.js'

const verify = (signature, message, publicKey) =>
  sodium.crypto_sign_verify_detached(signature, message, publicKey)

describe('crypto', () => {
  describe('slashtags key derivation', () => {
    it('should generate a keypair form a private key only with no name', () => {
      const primaryKey = b4a.from('a'.repeat(32), 'hex')
      const keyPair = createKeyPair(primaryKey)

      expect(keyPair.publicKey.length).to.equal(32)
      expect(keyPair.secretKey.length).to.equal(64)

      expect(keyPair.publicKey).to.eql(
        b4a.from(
          '2b8a8e5c7167f89b780fed400a238e13ac1c442ef7b6e9f4e1255aeed7e13ad2',
          'hex'
        )
      )
    })

    it('should generate a different keyPairs from different names', () => {
      const primaryKey = b4a.from('a'.repeat(32), 'hex')
      const keyPair = createKeyPair(primaryKey, 'foo')
      const keyPair2 = createKeyPair(primaryKey, 'bar')

      expect(keyPair.publicKey.length).to.equal(32)
      expect(keyPair.secretKey.length).to.equal(64)

      expect(keyPair.publicKey).to.eql(
        b4a.from(
          'b478b4e8f3ee07558e7756d421a3d2584b9cae2ec6bec09225138ed45f411916',
          'hex'
        )
      )

      expect(keyPair2.publicKey).to.eql(
        b4a.from(
          '491a34d3867adc5050ce43fa096e363b7460c75448fabd134f083122434254ab',
          'hex'
        )
      )
    })

    it('should generate a different keyPairs from different primaryKeys', () => {
      const keyPair = createKeyPair(b4a.from('a'.repeat(32), 'hex'), 'foo')
      const keyPair2 = createKeyPair(b4a.from('b'.repeat(32), 'hex'), 'foo')

      expect(keyPair.publicKey).to.eql(
        b4a.from(
          'b478b4e8f3ee07558e7756d421a3d2584b9cae2ec6bec09225138ed45f411916',
          'hex'
        )
      )

      expect(keyPair2.publicKey).to.eql(
        b4a.from(
          '8f06346b22e5a325ca66dabe08b6f26cc7d1f553be244bd61736075f7056936c',
          'hex'
        )
      )
    })
  })

  describe('keypair auth', () => {
    describe('signature', () => {
      it('should correctly sign a message', () => {
        const keyPair = createKeyPair(b4a.from('a'.repeat(32), 'hex'), 'foo')

        const message = b4a.from('Hello World')
        const signature = keyPair.auth.sign(message)

        expect(message).to.not.eql(signature)

        expect(verify(signature, message, keyPair.publicKey)).to.be.true()
      })
    })

    describe('verify', () => {
      it('should verify a valid message', () => {
        const keyPair = createKeyPair(b4a.from('a'.repeat(32), 'hex'), 'foo')

        const message = b4a.from('Hello World')
        const signature = keyPair.auth.sign(message)

        expect(message).to.not.eql(signature)

        expect(verify(signature, message, keyPair.publicKey)).to.be.true()
        expect(keyPair.auth.verify(message, signature)).to.be.true()
      })

      it('should return false for invalid signature', () => {
        const keyPair = createKeyPair(b4a.from('a'.repeat(32), 'hex'), 'foo')

        const message = b4a.from('Hello World')
        const invalidSignature = b4a.alloc(sodium.crypto_sign_BYTES)

        expect(
          verify(invalidSignature, message, keyPair.publicKey)
        ).to.be.false()
        expect(keyPair.auth.verify(message, invalidSignature)).to.be.false()
      })
    })
  })
})
