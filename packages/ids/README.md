# Slashtags IDs

> Contains Slashtags staticIDs and feedIDs.

## Feed IDs

Feed Ids are used to identify the mutable feeds.

```js
<feedID>: <multibase-prefix><multicodec-streamid><type><blacke2b>
```

## Static IDs

Static Ids are used to identify the static objects that are not expected to change, and the ids itself is a hash of that data.

```js
<staticID>: ::= <multibase-prefix><multicodec-cidv1><multicodec-content-type><multihash-content-address>
```

## Defaults

- `multibase-prefix`: `u` (base64url)
- `multicodec`: `cidv1`
- `multicodec-content-type`: `0x0200` (json)
- `multihash-content-address`: `blake2b-256`
