# Slashtags IDs

> Contains Slashtags contentIDs and feedIDs.

### Usage

```js

```

## Content IDs

Conent identifiers are used to identify immutable content by its hash.

Mainly used in Slashtags for pointing to schemas and labeling predefined actions.

A Slashtags content id has four parts:

```js
<stcid> ::= <mb><stcid-prefix><mc><mh>
// or, expanded:
<scid> ::= <multibase-prefix><slashtags-id-type><multicodec-content-type><multihash-content-address>
```

Where

- `<multibase-prefix>` is a [multibase](https://github.com/multiformats/multibase) code (1 or 2 bytes), to ease encoding CIDs into various bases. **NOTE:** _Binary_ (not text-based) protocols and formats may omit the multibase prefix when the encoding is unambiguous.

// TODO: add slashtags content ID `<multicodec-stcid>` to [multicodec](https://github.com/multiformats/multicodec)

- `<slashtags-id-type>` indicates that this is a Slashtags identifier and representing its version, for upgradability purposes.
- `<multicodec-content-type>` is a [multicodec](https://github.com/multiformats/multicodec) code representing the content type or format of the data being addressed.
- `<multihash-content-address>` is a [multihash](https://github.com/multiformats/multihash) value, representing the cryptographic hash of the content being addressed. Multihash enables STCIDs to use many different cryptographic hash function, for upgradability and protocol agility purposes.

defaults

- `<multibase-prefix>`: `u` (base64url)
- `<slashtags-id-type>`: `0` (content id)
- `<multicodec-content-type>`: indicates the content type and defaults to `0x0200` (json)
- hash function: `0x12` (sha256)

## Feed IDs

Feed Ids are used to identify the mutable feeds.

```js
<feedID>: <multibase-prefix><slashtags-id-type><type><blacke2b>
```
