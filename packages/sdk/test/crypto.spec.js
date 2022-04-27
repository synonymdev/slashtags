import { expect } from 'aegir/utils/chai.js'
import { createKeyPair } from '../src/crypto.js'
import b4a from 'b4a'

describe('crypto', () => {
  describe('slashtags key derivation', () => {
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
})
