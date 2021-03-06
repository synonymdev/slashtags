import b4a from 'b4a'

import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'

describe('slashtags', () => {
  it('should return the default slashtag if no key, name or url were passed', async () => {
    const sdkA = await sdk()

    expect(sdkA.slashtag()).to.eql(sdkA._root)
    expect(sdkA.slashtag({ url: sdkA._root.url.toString() })).to.eql(
      sdkA._root
    )

    await sdkA.close()
  })

  it('should not create a new instance of an already opened non-remote slashtag', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })

    const aliceAgain = sdkA.slashtag({ name: 'alice' })
    expect(aliceAgain).to.eql(alice)

    const aliceByKey = sdkA.slashtag({ key: alice.key })
    expect(aliceByKey).to.eql(alice)

    const aliceByURL = sdkA.slashtag({ url: alice.url.toString() })
    expect(aliceByURL).to.eql(alice)

    await sdkA.close()
  })

  it('should create a slashtag from a Uint8Array name', async () => {
    const sdkA = await sdk()

    sdkA.slashtag({ name: b4a.from('foo') })

    await sdkA.close()
  })

  it('should remove the slashtag on close', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })

    expect(sdkA.slashtags.get(alice.url.slashtag.toString())).to.eql(alice)

    await alice.close()

    expect(sdkA.slashtags.get(alice.url.slashtag.toString())).to.be.undefined()

    await sdkA.close()
  })

  it('should create slashtag and close it on sdk.close()', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })
    const bob = sdkA.slashtag({ name: 'bob' })

    const keys = [...sdkA.slashtags.keys()]

    expect(keys.length).to.eql(3)
    expect(keys.includes(alice.url.slashtag.toString())).to.be.true()
    expect(keys.includes(bob.url.slashtag.toString())).to.be.true()

    await sdkA.close()

    expect([...sdkA.slashtags.values()].map((s) => s.closed)).to.eql([
      true,
      true,
      true
    ])
  })

  it('should not create an already existing writable slashtag', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })
    sdkA.slashtag({ name: 'alice' })
    sdkA.slashtag({ name: 'alice' })

    const keys = [...sdkA.slashtags.keys()]

    expect(keys.length).to.eql(2)
    expect(keys.includes(alice.url.slashtag.toString())).to.be.true()

    await sdkA.close()
  })

  it('should create all remote slashtags without opening new resources', async () => {
    const sdkA = await sdk()
    const alice = sdkA.slashtag({ name: 'alice' })
    await alice.ready()

    const sdkB = await sdk()
    const bob = sdkB.slashtag({ name: 'bob' })
    await bob.ready()

    const remoteAlice = sdkB.slashtag({ url: alice.url.toString() })
    await remoteAlice.ready()

    expect(remoteAlice.swarm).to.eql(sdkB._root.swarm)

    await bob.listen()

    const { peerInfo } = await alice.connect(bob.url)
    const remoteBob = peerInfo.slashtag
    await remoteBob.ready()

    expect(remoteBob.key).to.eql(bob.key)
    expect(remoteBob.swarm).to.not.eql(alice.swarm)
    expect(remoteBob.swarm).to.eql(sdkA._root.swarm)

    expect(sdkA.slashtags.size).to.eql(
      2,
      'should not add remote slashtags to sdk.slashtags'
    )
    expect([...sdkA.slashtags.keys()]).to.eql([
      sdkA._root.url.slashtag.toString(),
      alice.url.slashtag.toString()
    ])

    await sdkA.close()
    await sdkB.close()
  })
})
