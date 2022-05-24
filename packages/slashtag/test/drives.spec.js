import { expect } from 'aegir/chai'
import b4a from 'b4a'

import { Slashtag, DRIVE_KEYS } from '../src/index.js'
import { getSwarmOpts } from './helpers/swarmOpts.js'

const swarmOpts = getSwarmOpts()

describe('drive', () => {
  describe('public', () => {
    it('should resolve remote profile: remote.getProfile()', async () => {
      const alice = new Slashtag({
        keyPair: Slashtag.createKeyPair(),
        swarmOpts
      })

      expect(await alice.getProfile()).to.be.null()

      const profile = {
        name: 'Alice'
      }

      await alice.setProfile(profile)

      expect(await alice.publicDrive.get(DRIVE_KEYS.profile)).to.eql(
        b4a.from(JSON.stringify(profile))
      )

      const remoteAlice = new Slashtag({
        key: alice.key,
        swarmOpts
      })

      expect(await remoteAlice.remote).to.be.true()
      expect(await remoteAlice.getProfile()).to.eql(profile)

      await alice.close()
      await remoteAlice.close()
    })

    it('should resolve remote profile from a remote slashtag from a direct connection', async () => {
      const alice = new Slashtag({
        keyPair: Slashtag.createKeyPair(),
        swarmOpts
      })
      expect(await alice.getProfile()).to.be.null()
      const profile = {
        name: 'Alice'
      }
      await alice.setProfile(profile)

      const bob = new Slashtag({
        keyPair: Slashtag.createKeyPair(),
        swarmOpts
      })

      const { peerInfo } = await bob.connect(alice.url)

      const remoteAlice = peerInfo.slashtag
      await remoteAlice.ready()

      expect(await remoteAlice.remote).to.be.true()
      expect(await remoteAlice.getProfile()).to.eql(profile)

      await alice.close()
      await bob.close()
    })
  })

  describe('private', () => {
    it('should create a private drive and resolve it as a remote drive', async () => {
      const alice = new Slashtag({
        keyPair: Slashtag.createKeyPair(),
        swarmOpts
      })

      // Alice creates a private drive for bob
      const drive = await alice.drive({
        name: 'a drive to share with bob',
        encrypted: true
      })

      const content = b4a.from('hello world')
      await drive.put('/messages/1', content)

      expect(drive.metadataDB.feed.length).to.be.greaterThan(3)
      expect(drive.encryptionKey.length).to.eql(32)

      // Bob loads the drive
      const bob = new Slashtag({
        keyPair: Slashtag.createKeyPair(),
        swarmOpts
      })

      const remoteDrive = await bob.drive({
        key: drive.key,
        encryptionKey: drive.encryptionKey
      })

      expect(remoteDrive.key).to.eql(drive.key)
      expect(remoteDrive.encryptionKey).to.eql(drive.encryptionKey)

      const read = await remoteDrive.get('/messages/1')
      expect(read).to.eql(content)

      await alice.close()
      await bob.close()
    })
  })
})
