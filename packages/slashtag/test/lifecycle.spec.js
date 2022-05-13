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
    expect(alice.key).to.eql(alice.publicDrive.key)

    await alice.close()
  })

  it('should use the passed hyperswarm for remote slashtags', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })
    await alice.ready()

    const bob = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })
    await bob.ready()

    const remoteAlice = new Slashtag({
      key: alice.key,
      swarm: bob.swarm,
      store: alice.store
    })
    await remoteAlice.ready()

    expect(remoteAlice.key).to.eql(alice.key)
    expect(remoteAlice.swarm).to.eql(bob.swarm)

    await remoteAlice.close()

    expect(remoteAlice.swarm.destroyed).to.be.false()
    expect(bob.swarm.destroyed).to.be.false()

    await bob.close()

    expect(remoteAlice.swarm.destroyed).to.be.true()
    expect(bob.swarm.destroyed).to.be.true()

    await alice.close()
  })

  it('should not use passed hyperswarms for local slashtags', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })
    await alice.ready()

    const bob = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts,
      swarm: alice.swarm
    })
    await bob.ready()

    expect(bob.swarm).to.not.eql(
      alice.swarm,
      'should not use the a hyperswarm with different keypair'
    )

    const aliceTwo = new Slashtag({
      keyPair: alice.keyPair,
      swarm: alice.swarm
    })
    await alice.ready()

    expect(aliceTwo.swarm).to.not.eql(
      alice.swarm,
      'should use the same hyperswarm with the same keypair'
    )

    await alice.close()
    await aliceTwo.close()
    await bob.close()
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

    expect(alice.closed).to.be.false()

    await alice.close()

    expect(alice.swarm.destroyed).to.be.true()
    expect(await closeEvent).to.be.true()
    expect(alice.closed).to.be.true()
  })

  it('should close all the slashtags created in connection peerInfo', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    await alice.listen()

    const bob = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const { peerInfo } = await bob.connect(alice.key)
    await peerInfo.slashtag.ready()

    await alice.close()
    await bob.close()

    expect(peerInfo.slashtag.closed).to.be.true()
  })
})
