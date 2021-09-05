# Slashtags Document IDs

> Contains Slashtags Document IDs ceration, serializing, and parsing

## Usage

```js
import slashtagsID from '@slashtags/ids';

const contentID = slashtagsID.create(0);
```

## Abstract

DocIDs are composed of a `multicodec-slashtags-docid`, and `type-code` varint, followed by identifying bytes.

## Motivation

A specific encoding for Slashtags' DocIDs allows us to distinguish them from other forms of identifiers as well distinguishing the type of data and how to parse the identifying bytes.

## Specification

```js
<slashtags-docid> ::= <mb><mc-docid><type-code><idb>
// or, expanded:
<slashtags-docid> ::= <multibase-prefix><multicodec-slashtags-docid><type-code><identifying-bytes>
```

Where

- `<multibase-prefix>` is a [multibase](https://github.com/multiformats/multibase) code (1 or 2 bytes), to ease encoding CIDs into various bases. **NOTE:** _Binary_ (not text-based) protocols and formats may omit the multibase prefix when the encoding is unambiguous.

- `<multicodec-slashtags-docid>`: `0xd2` indicates that this is a Slashtags identifier and representing.
- `<type-code>` Distinguish types data (static / stream) and how to parse the indentfiying bytes.
- `<identifying-bytes>` is a [multiformats](https://github.com/multiformats/) bytes specific to each `type-code`

### SlashtagsID multicodec

// TODO: add slashtags Document ID `<multicodec-slashtags-docid>` to [multicodec](https://github.com/multiformats/multicodec)

### DocID type

Used to encode multiple attributes about the ID and the document it represents:

- **Mutability**: Static content or updatable Streams.
- **Identifying bytes format**: How to parse the identifying bytes.
- **More**: Any future special kinds of documents with their own rules for verification ..etc

| name   | code | mutability | identifying bytes  |
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
<docid> ::= <mb><mc-docid><type-code=0><cid>
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
<docid> ::= <mb><mc-docid><type-code=0><feed-key>
// or, expanded:
<docid> ::= <multibase-prefix><multicodec-slashtags-docid><type-code=1><hypercore-feed-key>
```
