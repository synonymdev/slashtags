import { expect } from 'aegir/utils/chai.js'
import b4a from 'b4a'

import { Slashtag, DRIVE_KEYS } from '../src/index.js'
import { swarmOpts } from './helpers/swarmOpts.js'

const dhtOpts = swarmOpts()

describe('profile', () => {
  it('should set profile.json in the public drive', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts
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
      swarmOpts: dhtOpts
    })

    expect(await remoteAlice.getProfile()).to.eql(profile)

    await alice.close()
    await remoteAlice.close()
  })
})
