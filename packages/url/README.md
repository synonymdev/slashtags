# slashtags-url

Encodes and decodes Slashtags URLs

## Installation

```
npm install @synonymdev/slashtags-url
```

## Usage

```js
import { format, parse } from '@synonymdev/slashtags-url';

const url = format(key, {
  path: '/dir/file.json',
  query: { foo: 'bar' },
  fragment: { encryptionKey: '42' },
});
// url: slash://<z-base32 key>/dir/file.json?foo=bar#encryptionKey=42

const parsed = parse(url);
// {
//   protocol: 'slash:',
//   key: key,
//   path: '/dir/file.json',
//   query: { foo: 'bar' },
//   fragment: '#encryptionKey=42',
//   privateQuery: { encryptionKey: '42' }
// }

const id = encode(parsed.key);
// z-base32 key>
```

## API

#### const id = SlashURL.encode(key)

Encodes a 32-bytes key in z-base32.

#### const url = SlashURL.format(key, [opts])

Creates a URL from a 32-bytes key:

`key` must be a Buffer or an ArrayBuffer.
`opts` includes:

- `protocol` custom protocol, defaults to `slash:`
- `path` a string representing the path, defaults to `/`.
- `query` a query string or a key-value object to format as the query part of the url.
- `fragment` a fragment string or a key-value object to format as a private query in the fragment.

#### const url = SlashURL.parse(url)

Parses a url to return the following:

- `key` Uint8Array of the key parsed from the host part of the url.
- `id` z-base32 encoding of the key, useful as identifier wherever a URL is not suitable (file names).
- `protocol` the protocol part of the url.
- `path` the path part of the url.
- `query` the query parsed as a key value object.
- `fragment` string of the fragment part.
- `privateQuery`: parsed private query from the fragment part of the url.
