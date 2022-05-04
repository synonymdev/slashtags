import { expect } from 'aegir/chai'

import { Slashtag } from '../src/index.js'
import { getSwarmOpts } from './helpers/swarmOpts.js'

const swarmOpts = getSwarmOpts()

describe('ready', () => {
  it('should set attributes after ready', async () => {
    const keyPair = Slashtag.createKeyPair()

    const alice = new Slashtag({
      keyPair,
      swarmOpts
    })
    await alice.ready()

    expect(alice.key).to.eql(keyPair.publicKey)
    expect(alice.swarm).to.not.be.undefined()

    await alice.close()
  })
})

describe('close', () => {
  it('should close all resources and emit close event', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    await alice.ready()

    const closeEvent = new Promise((resolve) => {
      alice.once('close', () => resolve(true))
    })

    await alice.close()

    expect(alice.swarm.destroyed).to.be.true()
    expect(await closeEvent).to.be.true()
  })
})
