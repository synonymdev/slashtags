import slashtags from '@synonymdev/slashtags-core';
import { slashIdentity } from '../src/index.js';

describe.skip('create', () => {
  it('should create a new did', async () => {
    const slash = await slashtags().use(slashIdentity).ready();

    const did = slash.identityCreate();

    console.log(did);
    slash.emit('close');
  });
});
