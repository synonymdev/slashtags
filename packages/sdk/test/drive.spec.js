import { expect } from 'aegir/utils/chai.js'
import { SlashDrive } from '../src/index.js'
import { SDK } from '../src/sdk.js'
import b4a from 'b4a'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk () {
  return SDK.init({ bootstrap, relays: [RELAY_URL] })
}

describe.only('drive', () => {
  it('should create a Slashdrive, write and read a blob of data', async () => {
    const alice = await sdk()

    const drive = await SlashDrive.init({ name: 'drive for bob', sdk: alice })

    const content = b4a.from(JSON.stringify({ foo: 'bar' }))
    const other = b4a.from(JSON.stringify({ foo: 'zar' }))

    await drive.write('/.profile.json', content)
    await drive.write('/other.json', other)

    const read = await drive.read('/.profile.json')
    const readOther = await drive.read('/other.json')

    expect(read).to.eql(content)
    expect(readOther).to.eql(other)

    await alice.close()
  })

  it('should resolve a remote drive', async () => {
    const alice = await sdk()

    const localDrive = await SlashDrive.init({
      sdk: alice,
      name: 'drive for bob',
      announce: true
    })
    const localContent = b4a.from(JSON.stringify({ foo: 'bar' }))
    await localDrive.write('/.profile.json', localContent)

    const bob = await sdk()
    const remoteDrive = await SlashDrive.init({
      sdk: bob,
      key: localDrive.key,
      lookup: true
    })

    const remoteContent = await remoteDrive.read('/.profile.json')

    expect(remoteContent).to.eql(localContent)

    await alice.close()
    await bob.close()
  })

  it('should return null for unresolvable SlashDrive', async () => {
    const alice = await sdk()

    const localDrive = await SlashDrive.init({
      sdk: alice,
      name: 'drive for bob',
      announce: false
    })

    const bob = await sdk()
    const remoteDrive = await SlashDrive.init({
      sdk: bob,
      key: localDrive.key,
      lookup: true
    })

    expect(remoteDrive).to.eql(null)

    await alice.close()
    await bob.close()
  })

  it('should return null for not-found files', async () => {
    const alice = await sdk()

    const localDrive = await SlashDrive.init({
      sdk: alice,
      name: 'drive for bob',
      announce: true
    })

    const bob = await sdk()
    const remoteDrive = await SlashDrive.init({
      sdk: bob,
      key: localDrive.key,
      lookup: true
    })

    const remoteContent = await remoteDrive.read('/.profile.json')

    expect(remoteContent).to.eql(null)

    await alice.close()
    await bob.close()
  })

  it('should accepts a keypair instead of a name', async () => {
    const alice = await sdk()
    const byName = await SlashDrive.init({ name: 'drive for bob', sdk: alice })

    const keyPair = await alice.keys.createKeyPair('drive for bob')
    expect(byName.key).to.eql(keyPair.publicKey)

    const byKeyPair = await SlashDrive.init({ keyPair, sdk: alice })
    expect(byName.key).to.eql(byKeyPair.key)

    await alice.close()
  })
})
