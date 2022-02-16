import { expect } from 'aegir/utils/chai.js'
import slashtags, { Slashtags } from '../src/index.js'
import EventEmitter from 'events'

describe('Constructor function', () => {
  it('should return an instance of slashtags', async () => {
    const slash = slashtags()

    expect(slash).to.be.an.instanceof(Slashtags)
    expect(slash).to.be.an.instanceof(EventEmitter)
    expect(slash.use).to.be.a('function')
    expect(slash.ready).to.be.a('function')
  })

  it('should remove the setup private property after ready', async () => {
    const slash = slashtags().use(async function () {}, {})

    expect(slash._setup).to.not.be.undefined()
    expect(slash.status.loaded).to.be.false()
    await slash.ready()
    expect(slash._setup).to.be.undefined()
    expect(slash.status.loaded).to.be.true()
  })

  it('should not throw errors if ready called twice', async () => {
    expect(
      async () => await (await slashtags().ready()).ready()
    ).to.not.throw()
  })
})
