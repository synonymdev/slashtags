import { expect } from 'aegir/utils/chai.js';
import slashtags from '@synonymdev/slashtags-core';
import { slashIdentity } from '../src/index.js';

describe.only('Identity - default provider', () => {
  it('should create a new identifier', async () => {
    const slash = await slashtags().use(slashIdentity).ready();

    const { did } = await slash.identityCreate({
      services: [{ id: 'foo', serviceEndpoint: 'bar', type: 'test' }],
    });

    expect(did).to.startWith('did:slash:');

    const identifier = await slash.identityGet({ did });

    expect(identifier).to.eql({
      did: did,
      services: [
        {
          id: 'foo',
          serviceEndpoint: 'bar',
          type: 'test',
        },
      ],
    });
  });

  it('should upserts services in existing identifier', async () => {
    const slash = await slashtags().use(slashIdentity).ready();

    const { did } = await slash.identityCreate({
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        { id: 'foo', serviceEndpoint: 'bar', type: 'test' },
      ],
    });

    expect(did).to.startWith('did:slash:');

    const identifier = await slash.identityGet({ did });

    expect(identifier).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        { id: 'foo', serviceEndpoint: 'bar', type: 'test' },
      ],
    });

    const services = [
      { id: 'foo', serviceEndpoint: 'updated-endpoint', type: 'updated-type' },
      { id: 'new', serviceEndpoint: 'new-endpoint', type: 'new-type' },
    ];

    const updated = await slash.identityUpsertServices({ did, services });

    expect(updated).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        ...services,
      ],
    });

    const fetched = await slash.identityGet({ did });

    expect(updated).to.eql({
      did: did,
      services: [
        { id: 'leave-this-alone', serviceEndpoint: 'bar', type: 'test' },
        ...services,
      ],
    });
  });
});
