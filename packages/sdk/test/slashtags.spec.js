import b4a from 'b4a'

import { expect } from 'aegir/chai'
import { sdk } from './helpers/setup-sdk.js'

describe('slashtags', () => {
  it('should throw an error if no key or url was given', async () => {
    const sdkA = await sdk()

    expect(() => sdkA.slashtag({})).to.throw('Missing keyPair, key, or url')

    await sdkA.close()
  })

  it('should not create a new instance of an already opened slashtag', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })

    const aliceAgain = sdkA.slashtag({ name: 'alice' })
    expect(aliceAgain).to.eql(alice)

    await sdkA.close()
  })

  it('should remove the slashtag on close', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })

    expect(sdkA.slashtags.get(alice.key)).to.eql(alice)

    await alice.close()

    expect(sdkA.slashtags.get(alice.key)).to.be.undefined()

    await sdkA.close()
  })

  it('should create slashtag and close it on sdk.close()', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })
    const bob = sdkA.slashtag({ name: 'bob' })

    const keys = [...sdkA.slashtags.keys()].map((key) => b4a.toString(key))

    expect(keys.length).to.eql(2)
    expect(keys.includes(b4a.toString(alice.key))).to.be.true()
    expect(keys.includes(b4a.toString(bob.key))).to.be.true()

    await sdkA.close()

    expect([...sdkA.slashtags.values()].map((s) => s.closed)).to.eql([
      true,
      true
    ])
  })

  it('should not create an already existing writable slashtag', async () => {
    const sdkA = await sdk()

    const alice = sdkA.slashtag({ name: 'alice' })
    sdkA.slashtag({ name: 'alice' })
    sdkA.slashtag({ name: 'alice' })

    const keys = [...sdkA.slashtags.keys()].map((key) => b4a.toString(key))

    expect(keys.length).to.eql(1)
    expect(keys.includes(b4a.toString(alice.key))).to.be.true()

    await sdkA.close()
  })
})
