import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import { hasher, digest } from 'multiformats';
import crypto from 'crypto';
import * as json from 'multiformats/codecs/json';

// describe('Slashtags Identifiers: CID', () => {
//   it('should create a cid from a hash', async () => {
//   });
// });

import test from 'ava';

test('bar', async (t) => {
  const bytes = json.encode({ hello: 'world' });

  const hashFn = (bytes) => crypto.createHash('sha256').update(bytes).digest();

  const hash = digest.create(sha256.code, hashFn(bytes));

  console.log(hash);

  const cid = CID.create(1, json.code, hash);

  console.log(cid.toString());
  t.is(
    cid.toString(),
    'bagaaierasords4njcts6vs7qvdjfcvgnume4hqohf65zsfguprqphs3icwea',
  );
});
