import b4a from 'b4a'
import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'

const testVectors = [
  {
    description: '0*64 ALICE FOO',
    primaryKey: '0'.repeat(64),
    slashtagName: 'ALICE',
    slashtagKey:
      '9d2c25f4799ddc61d68fbf14e653e7ee8f69eab1a32234906d226a59cf629d68',
    driveName: 'FOO',
    driveKey:
      'c5f64d5e61d5fc2193f359aff015fbc30a3e9e41a68a446e7c80e7d4f9947431'
  },
  {
    // Same PrimaryKey, same slashtag name, different drive name
    description: '0*64 ALICE BAR',
    primaryKey: '0'.repeat(64),
    slashtagName: 'ALICE',
    slashtagKey:
      '9d2c25f4799ddc61d68fbf14e653e7ee8f69eab1a32234906d226a59cf629d68',
    driveName: 'BAR',
    driveKey:
      'e9b9184f0cd754199c622a2ed5cb0681094eec27f44244333cd261e89700ec10'
  },
  {
    // Same PrimaryKey, same drive name, different Slashtag name
    description: '0*64 BOB FOO',
    primaryKey: '0'.repeat(64),
    slashtagName: 'BOB',
    slashtagKey:
      '46636c43911a2e8523171fcc2d5e1c0234a46b0053880c572618af89ddae2ee0',
    driveName: 'FOO',
    driveKey:
      '2499c52085aa6f6239fa807351b3d556271fd431f728de64f56ad066eeb40856'
  },
  {
    // Same slashtag name, same drive name, different primaryKey
    description: 'f*64 ALICE FOO',
    primaryKey: 'f'.repeat(64),
    slashtagName: 'Alice',
    slashtagKey:
      'b87b3c477dfb02bcb75aaa9ad658f6c01063b4e18ed2265a8b4d786684744b62',
    driveName: 'FOO',
    driveKey:
      'e0dbfbf0c666d64172fbfcd8ca2569514b304b5147ae1ee90939892c5fd4de88'
  }
]

describe('keys', () => {
  for (const vector of testVectors) {
    it('should pass test vector: ' + vector.description, async () => {
      const primaryKey = b4a.from(vector.primaryKey, 'hex')
      const sdkA = await sdk({ primaryKey })
      const slashtag = sdkA.slashtag({ name: vector.slashtagName })
      expect(slashtag.key).to.eql(b4a.from(vector.slashtagKey, 'hex'))

      const drive = await slashtag.drive({ name: vector.driveName })
      expect(drive.key).to.eql(b4a.from(vector.driveKey, 'hex'))

      await sdkA.close()
    })
  }

  it('should hash the primaryKey before passing it to the Corestore', async () => {
    const primaryKey = b4a.from('0'.repeat(64), 'hex')
    const sdkA = await sdk({ primaryKey })

    expect(sdkA.primaryKey.length).to.equal(32)
    expect(sdkA._root.store.primaryKey.length).to.equal(32)

    expect(sdkA.primaryKey).to.not.eql(sdkA._root.store.primaryKey)

    expect(sdkA._root.store.primaryKey).to.eql(
      b4a.from(
        '89eb0d6a8a691dae2cd15ed0369931ce0a949ecafa5c3f93f8121833646e15c3',
        'hex'
      )
    )

    await sdkA.close()
  })

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
