import b4a from 'b4a'
import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'

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

    await sdkA.close()
  })
})
