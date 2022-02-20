import { expect } from 'aegir/utils/chai.js';
import slashtags from '@synonymdev/slashtags-core';
import { slashKeyChain } from '../src/index.js';

describe('Key Chain', () => {
  it('should generate new ED255190 key', async () => {
    const slash = await slashtags().use(slashKeyChain).ready();

    const first = slash.keyChainGenerateKey({ offset: 5 });
    const second = slash.keyChainGenerateKey();

    expect(first.type).to.equal('Ed25519');
    expect(second.type).to.equal('Ed25519');

    expect(first.secretKey).to.eql(
      slash.keyChainGenerateKey({ offset: 5 }).secretKey,
    );

    expect(first.secretKey).to.not.eql(second.secretKey);
  });
});
