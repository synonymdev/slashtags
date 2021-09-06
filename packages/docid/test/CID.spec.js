import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { digest } from 'multiformats';
import crypto from 'crypto';
import * as json from 'multiformats/codecs/json';
import assert from 'assert';
import * as DocID from '../src/index.js';

describe('Slashtags DocID: CID: createCID()', () => {
  it('should create CID document ID from content', () => {
    const bytes = json.encode({ hello: 'world' });
    const hashFn = () => crypto.createHash('sha256').update(bytes).digest();
    const hash = digest.create(sha256.code, hashFn());
    const cid = CID.create(1, json.code, hash);

    assert.deepEqual(DocID.create('CID', cid.bytes), {
      type: {
        code: 0,
        mutability: 'Static',
        name: 'CID',
      },
      bytes: Uint8Array.from([
        210, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
        240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20,
        212, 124, 96, 243, 203, 104, 21, 136,
      ]),
    });

    assert.deepEqual(
      DocID.create('CID', cid.bytes),
      DocID.CID.fromJSON({ hello: 'world' }),
    );
  });
});
