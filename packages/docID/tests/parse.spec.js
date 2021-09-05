import { DocID } from '../src/index.js';
import { createCID } from '../src/docTypes/CID.js';
import { base32 } from 'multiformats/bases/base32';
import assert from 'assert';

describe('Slashtags DocID: parse()', () => {
  it('should create DocID from a valid string', () => {
    const bytes = DocID.toString(createCID({ hello: 'world' }));

    assert.deepEqual(DocID.parse(bytes), {
      type: {
        code: 0,
        mutability: 'Static',
        name: 'CID',
      },
      identifyingBytes: Uint8Array.from([
        1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203, 240, 168,
        210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20, 212, 124, 96,
        243, 203, 104, 21, 136,
      ]),
    });
  });

  it('should create DocID from a valid bytes', () => {
    const bytes = base32.encode(DocID.create(1, Uint8Array.from([0])).bytes);

    assert.deepEqual(DocID.parse(bytes), {
      type: {
        code: 1,
        mutability: 'Stream',
        name: 'FeedID',
      },
      identifyingBytes: Uint8Array.from([0]),
    });
  });

  it('should return undefined if it is not a valid DocID', () => {
    const bytes = base32.encode(
      Uint8Array.from([
        420, 1, 0, 1, 128, 4, 18, 32, 147, 162, 57, 113, 169, 20, 229, 234, 203,
        240, 168, 210, 81, 84, 205, 163, 9, 195, 193, 199, 47, 187, 153, 20,
        212, 124, 96, 243, 203, 104, 21, 136,
      ]),
    );

    assert.deepEqual(DocID.parse(bytes), undefined);
  });
});
