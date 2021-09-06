import * as DocID from '../src/index.js';
import { base32 } from 'multiformats/bases/base32';
import * as multiformats from 'multiformats';
import { wildDecode } from '../src/util.js';
import assert from 'assert';

describe('Slashtags DocID: wildDecode()', () => {
  it('should decode baes32 encoded string', () => {
    const cid = DocID.CID.fromJSON({ foo: 'bar' });
    const str = base32.encode(cid.bytes);

    assert.deepStrictEqual(wildDecode(str), cid.bytes);
  });

  it('should decode baes32 encoded Uint8Array', () => {
    const cid = DocID.CID.fromJSON({ foo: 'bar' });
    const bytes = multiformats.bytes.fromString(base32.encode(cid.bytes));

    assert.deepStrictEqual(wildDecode(bytes), cid.bytes);
  });

  it('should throw an error for unsupported encoding', () => {
    const cid = DocID.CID.fromJSON({ foo: 'bar' });
    const str = '^' + cid.toString();

    let error;
    try {
      wildDecode(str);
    } catch (err) {
      error = err;
    }

    assert.equal(error instanceof Error, true);
    assert.equal(error.message, 'Unsupported encoding: ^');
  });
});
