import { expect } from 'aegir/utils/chai.js'
import slashtags from '@synonymdev/slashtags-core'
import { slashIdentity } from '../src/index.js'
import { slashHyperSwarm } from '../src/hyper/hyperswarm/index.js'

const { RELAY_URL, BOOTSTRAP } = process.env
const DHTOPTS = { relays: [RELAY_URL], bootstrap: JSON.parse(BOOTSTRAP) }

describe('Identity - default provider', () => {
  it('should create a new identifier', async () => {
    const slash = await slashtags().use(slashIdentity).ready()

    const { did } = await slash.identityCreate({
      services: [{ id: 'foo', serviceEndpoint: 'bar', type: 'test' }]
    })

    expect(did).to.startWith('did:slash:')

    const identifier = await slash.identityGet({ did })

    expect(identifier).to.eql({
      did: did,
      services: [
        {
          id: 'foo',
          serviceEndpoint: 'bar',
          type: 'test'
        }
      ]
    })

    slash.close()
  })

  it('should upserts services in existing identifier', async () => {
    const slash = await slashtags().use(slashIdentity).ready()

    const { did } = await slash.identityCreate({
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        { id: 'foo', serviceEndpoint: 'bar', type: 'test' }
      ]
    })

    expect(did).to.startWith('did:slash:')

    const identifier = await slash.identityGet({ did })

    expect(identifier).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        { id: 'foo', serviceEndpoint: 'bar', type: 'test' }
      ]
    })

    const services = [
      { id: 'foo', serviceEndpoint: 'updated-endpoint', type: 'updated-type' },
      { id: 'new', serviceEndpoint: 'new-endpoint', type: 'new-type' }
    ]

    const updated = await slash.identityUpsertServices({ did, services })

    expect(updated).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        ...services
      ]
    })

    const fetched = await slash.identityGet({ did })

    expect(fetched).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        ...services
      ]
    })

    slash.close()
  })

  it('should get identifier from other node', async () => {
    const nodeA = await slashtags()
      .use(slashHyperSwarm, { dhtOptions: DHTOPTS })
      .use(slashIdentity)
      .ready()

    const { did } = await nodeA.identityCreate({
      services: [{ id: 'foo', serviceEndpoint: 'bar', type: 'test' }]
    })

    const identifierAtnodeA = await nodeA.identityGet({ did })
    expect(identifierAtnodeA).to.eql({
      did,
      services: [{ id: 'foo', serviceEndpoint: 'bar', type: 'test' }]
    })

    const nodeB = await slashtags()
      .use(slashHyperSwarm, { dhtOptions: DHTOPTS })
      .use(slashIdentity)
      .ready()

    const identifierAtnodeB = await nodeB.identityGet({ did })

    expect(identifierAtnodeB).to.eql(
      identifierAtnodeA,
      'should resolve the same identifier'
    )

    nodeA.close()
    nodeB.close()
  })
})
