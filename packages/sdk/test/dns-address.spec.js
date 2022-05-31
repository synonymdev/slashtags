import { expect } from 'aegir/chai';
import { sdk } from './helpers/setup-sdk.js';

const wellKnownPath = '/.well-known/slashtags';

describe('dns-address', () => {
  it('should parse slashtags address correctly alice@example.com', async () => {
    const sdkA = await sdk();

    const url = sdkA._root.url.toString();

    const slashtag = await sdkA.fromDNS('alice@example.com', {
      fetch: async (...args) => {
        expect(args[0]).to.eql(
          'https://example.com' + wellKnownPath + '?name=alice',
        );
        return { json: async () => ({ alice: url }) };
      },
    });

    expect(slashtag.url.toString()).to.eql(url);
    expect(slashtag.remote).to.be.true();

    sdkA.close();
  });

  it('should parse slashtags address correctly alice.com (root domain)', async () => {
    const sdkA = await sdk();

    const url = sdkA._root.url.toString();

    const slashtag = await sdkA.fromDNS('example.com', {
      fetch: async (...args) => {
        expect(args[0]).to.eql(
          'https://example.com' + wellKnownPath + '?name=_',
        );
        return { json: async () => ({ _: url }) };
      },
    });

    expect(slashtag.url.toString()).to.eql(url);
    expect(slashtag.remote).to.be.true();

    sdkA.close();
  });

  it('should allow custom protocol (support http for testing)', async () => {
    const sdkA = await sdk();

    const url = sdkA._root.url.toString();

    const slashtag = await sdkA.fromDNS('example.com', {
      fetch: async (...args) => {
        expect(args[0]).to.eql(
          'http://example.com' + wellKnownPath + '?name=_',
        );
        return { json: async () => ({ _: url }) };
      },
      protocol: 'http://',
    });

    expect(slashtag.url.toString()).to.eql(url);
    expect(slashtag.remote).to.be.true();

    sdkA.close();
  });
});
