import * as FeedID from '@synonymdev/slashtags-docid';
import { format } from '../src/index.js';
import test from 'ava';

test('should format slashtags url correctly', (t) => {
  const feedID = FeedID.create(1, Buffer.alloc(32).fill('a'));

  t.deepEqual(
    format({ feedID }),
    'slash://b2iaqcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylb/',
  );
});

test('should format string docID', (t) => {
  const feedID = FeedID.create(1, Buffer.alloc(32).fill('a'));

  t.deepEqual(
    format({ feedID: FeedID.toString(feedID) }),
    'slash://b2iaqcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylb/',
  );
});

test('should format queries', (t) => {
  const feedID = FeedID.create(1, Buffer.alloc(32).fill('a'));

  t.deepEqual(
    format({ feedID, query: { act: 1, tkt: 'foobar' } }),
    'slash://b2iaqcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylbmfqwcylb/?act=1&tkt=foobar',
  );
});
