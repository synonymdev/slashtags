# Slashtags Document IDs

> Contains Slashtags Document IDs ceration, serializing, and parsing

## Usage

### FeedID

Create a FeedID typed DocID from hypercore feed key

```js
import * as DocID from '@slashtags/ids';
import hypercore from 'hypercore';

var feed = new Hypercore('./my-first-dataset');

// You can pass the type name instead of the type code
const docID = DocID.create('FeedID', feed.key);
```

### CID

Create a CID typed DocID from json with sha256

```js
import * as DocID from '@slashtags/ids';
const docID = DocID.CID.fromJSON({ foo: 'bar' });
```

Or by passing CID bytes

```js
import * as DocID from '@slashtags/ids';
import { CID } from 'multiformats/cid';
import * as json from 'multiformats/codecs/json';
import { sha256 } from 'multiformats/hashes/sha2';

const bytes = json.encode({ hello: 'world' });
const hash = await sha256.digest(bytes);
const cid = CID.create(1, json.code, hash);

const docID = DocID.create(0, cid.bytes);
```

## Abstract

DocIDs are composed of a `multicodec-slashtags-docid`, and `type` varint, followed by identifying bytes.

## Motivation

A specific encoding for Slashtags' DocIDs allows us to distinguish them from other forms of identifiers as well distinguishing the type of data and how to parse the identifying bytes.

## Specification

```js
<slashtags-docid> ::= <mb><mc-docid><type><key>
// or, expanded:
<slashtags-docid> ::= <multibase-prefix><multicodec-slashtags-docid><type><key>
```

Where

- `<multibase-prefix>` is a [multibase](https://github.com/multiformats/multibase) code (1 or 2 bytes), to ease encoding CIDs into various bases. **NOTE:** _Binary_ (not text-based) protocols and formats may omit the multibase prefix when the encoding is unambiguous.

- `<multicodec-slashtags-docid>`: `0xd2` indicates that this is a Slashtags identifier.
- `<type>` describes mutability (static / stream), how to read and use the `key`, and any idiosyncratic rules.
- `<key>` is used for document's storage, addressing, and discovery according to the `type`.

### SlashtagsID multicodec

// TODO: add slashtags Document ID `<multicodec-slashtags-docid>` to [multicodec](https://github.com/multiformats/multicodec)

### DocID type

Used to encode multiple attributes about the ID and the document it represents:

- **Mutability**: Static content or updatable Streams.
- **key format**: How to parse the key bytes if needed.
- **Data storage** How to use the key to store and query for the document.
- **More**: Any future special kinds of documents with their own rules for verification ..etc

| name   | code | mutability | key                |
| ------ | ---- | ---------- | ------------------ |
| CID    | 0    | static     | CID                |
| FeedID | 1    | stream     | Hypercore feed key |

### Static vs Stream documents

Static documents are immutable and relatively small piece of data, mainly used in Slashtags for [schemas]() and labeling predefined [Actions]().

Unlike streams, static documents are not assumed to be stored as `append only log` nor any other format, so they require less overhaed.

## Types

### CID

A Slashtags DocID of type `CID` has four parts:

```js
<docid> ::= <mb><mc-docid><type=0><key=cid>
// or, expanded:
<docid> ::= <multibase-prefix><multicodec-slashtags-docid><type-code=0><multicodec-cid><multicodec-content-type><multihash-content-address>
```

Where

- `<multibase-prefix>`: defaults to `base32`
- `<type-code>` is `0`
- `<identifying-bytes>` is a [CID](https://github.com/multiformats/cid)

### FeedID

A Slashtags DocID of type `FeedID` has four parts:

```js
<docid> ::= <mb><mc-docid><type-code=0><key=feed-key>
// or, expanded:
<docid> ::= <multibase-prefix><multicodec-slashtags-docid><type=1><hypercore-feed-key>
```
