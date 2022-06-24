import b4a from 'b4a'
import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'

const testVectors = [
  {
    description: '0*64 ALICE FOO',
    primaryKey: '0'.repeat(64),
    default: '5400e38e349c6c48fbf8c527c9bc88b9db8aa26e96828560bcfc27951ea3d37c',
    slashtagName: 'ALICE',
    slashtagKey:
      '9d2c25f4799ddc61d68fbf14e653e7ee8f69eab1a32234906d226a59cf629d68',
    driveName: 'FOO',
    driveKey:
      'b02e2307b61e6f1244045451b01a517540d20a094ef593100fd326e7ec61e055'
  },
  {
    // Same PrimaryKey, same slashtag name, different drive name
    description: '0*64 ALICE BAR',
    primaryKey: '0'.repeat(64),
    default: '5400e38e349c6c48fbf8c527c9bc88b9db8aa26e96828560bcfc27951ea3d37c',
    slashtagName: 'ALICE',
    slashtagKey:
      '9d2c25f4799ddc61d68fbf14e653e7ee8f69eab1a32234906d226a59cf629d68',
    driveName: 'BAR',
    driveKey:
      'a0511836b1599e3fa54eb1e97781a2d144e67016ac123e1aa2ccb231e362039d'
  },
  {
    // Same PrimaryKey, same drive name, different Slashtag name
    description: '0*64 BOB FOO',
    primaryKey: '0'.repeat(64),
    default: '5400e38e349c6c48fbf8c527c9bc88b9db8aa26e96828560bcfc27951ea3d37c',
    slashtagName: 'BOB',
    slashtagKey:
      '46636c43911a2e8523171fcc2d5e1c0234a46b0053880c572618af89ddae2ee0',
    driveName: 'FOO',
    driveKey:
      '9c900e3bf8c165ab1b330d3b2c0d8e3f59f99f3142aceb7d379bec9bc0891d78'
  },
  {
    // Same slashtag name, same drive name, different primaryKey
    description: 'f*64 ALICE FOO',
    primaryKey: 'f'.repeat(64),
    default: 'c0e8a73aba8b4c6e9d10964064e8f4dc0ee31e16f2ba681f964ce3d7a163dcd3',
    slashtagName: 'Alice',
    slashtagKey:
      'b87b3c477dfb02bcb75aaa9ad658f6c01063b4e18ed2265a8b4d786684744b62',
    driveName: 'FOO',
    driveKey:
      '942aa2b8e21d0b347001d5355c28c08e5ab1906af36264da39a8a95696aea27e'
  }
]

describe('keys', () => {
  for (const vector of testVectors) {
    it('should pass test vector: ' + vector.description, async () => {
      const primaryKey = b4a.from(vector.primaryKey, 'hex')
      const sdkA = await sdk({ primaryKey })

      const defaultSlashtag = await sdkA.slashtag()
      expect(defaultSlashtag.key).to.eql(b4a.from(vector.default, 'hex'))

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
