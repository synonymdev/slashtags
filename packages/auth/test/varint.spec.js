import assert from 'assert';
import originalVarint from 'varint';
import * as varint from '../src/varint.js';

describe('Slashtags Auth: varint.prepend()', () => {
  it('should prepend one integer as varint to a Uint8Array', () => {
    const bytes = new TextEncoder().encode('foobar');
    const int = 42;

    const result = varint.prepend(int, bytes);
    assert.deepEqual(result, Uint8Array.from([int, ...bytes]));
  });

  it('should prepend one integer bigger than 128 as varint to a Uint8Array', () => {
    const bytes = new TextEncoder().encode('foobar');
    const int = 128;

    const result = varint.prepend(int, bytes);
    assert.deepEqual(
      result,
      Uint8Array.from([...originalVarint.encode(int), ...bytes]),
    );
  });

  it('should prepend multiple integers as varints to a Uint8Array', () => {
    const bytes = new TextEncoder().encode('foobar');
    const int = [42, 128, 110];

    const result = varint.prepend(int, bytes);
    assert.deepEqual(result, Uint8Array.from([42, 128, 1, 110, ...bytes]));
  });
});

describe('Slashtags Auth: varint.split()', () => {
  it('should return a tuple of the first varint and the rest', () => {
    const bytes = new TextEncoder().encode('foobar');
    const int = [42, 128, 110];

    const result = varint.prepend(int, bytes);

    assert.deepEqual(varint.split(result), [
      42,
      Uint8Array.from([128, 1, 110, ...bytes]),
      1,
    ]);
  });
});
