# SlashDrive

SlashDrive is a simple, secure, realtime distributed Object-storage system optimized for p2p sharing.

SlashDrive consists of two Append-only logs, one for storing objects metadata, and the other holds the blobs of data, allowing p2p sharing of metadata without the overhead of sharing the contents as well.

SlashDrive is based on Hypercore and is designed with Hyperswarm p2p discovery in mind.

## Installation

```
npm install @synonymdev/slashdrive corestore@^6.0.0
```

## Usage

```js
import Corestore from 'corestore';
import b4a from 'b4a';
import { SlashDrive } from './src/index.js';

// Create a local drive using a name and Corestore instance
const originStore = new Corestore('./path/to/storage/origin/');
const origin = new SlashDrive({
  keyPair: await originStore.createKeyPair('foo'),
  store: originStore,
  encrypted: true,
});

// Write an object
await origin.put('foo', b4a.from(JSON.stringify({ name: 'Alice' })));

// Share your drive data
const driveDetails = {
  key: origin.key,
  encryptionKey: origin.encryptionKey,
};

// Peers trying to read your drive now can use the drive details you shared with them
const clone = new SlashDrive({
  store: new Corestore('./path/to/storage/clone/'),
  ...driveDetails,
});

// Replicate the two drives over any duplex stream
const s = clone.replicate(true);
s.pipe(origin.replicate(false)).pipe(s);

// Read the object from the cloned drive
const object = await clone.get('foo');
console.log(object.toString()); //=> '{"name":"Alice"}'
```

## API

#### `const drive = new SlashDrive(options)`

Make a new SlashDrive instance.

`options` include:

```js
{
  store: store, // corestore@^6.0.0 instance
  name: string, //
  keyPair: kp, // optionally pass the public key and secret key as a key pair
  keyPair: k, // optionally pass the public key of a remote drive.
  encrypted: true, // Generate an encryptionKey and encrypt metadata and content cores with it
  encryptionKey: k // optionally pass an encryption key for remote encrypted drives, if it is a writable drive, this will be ignored.
}
```

_NOTE_ `drive.store` is replaced with the a namespaced instance, so `drive.store.close()` won't close the parent store you passed to the drive options.

#### `await drive.ready()`

Wait for the drive to fully open.

After `ready()` has been called, the `this.discoveryKey` and other properties have been set.

In general you do NOT need to wait for ready, unless checking a synchronous property, as all internals await this themselves.

#### `drive.key`

Buffer containing the public key identifying this core.

#### `drive.keyPair`

Object containing the publicKey, secretKey and auth object for this core.

#### `drive.discoveryKey`

Buffer containing a key derived from the metadata's core's public key. In contrast to core.key this key does not allow you to verify the data but can be used to announce or look for peers that are sharing the same drive, without leaking the core key.

#### `drive.encryptionKey`

Buffer containing the optional encryption key for this drive.

#### `drive.writable`

Returns true if the metadata core and the content core are both [writable](https://github.com/hypercore-protocol/hypercore-next/#corewritable)

#### `drive.readable`

Returns true if the metadata core and the content core are both [readable](https://github.com/hypercore-protocol/hypercore-next/#corereadable).

Especially useful in remote drives to check if the drive got the content core already.

Cases where the drive is not readable:

- Metadata or Content core is not [readable](https://github.com/hypercore-protocol/hypercore-next#corereadable)

- Metadata core in a remote Drive doesn't contain enough information to retrieve the content core.

- Metadata core is encrypted so the content core can't be retrieved.

- metadataDB is corrupt in some way that prevents the content from being retrieved.

#### `drive.peers`

An array of [Peer](https://github.com/hypercore-protocol/hypercore-next/blob/master/lib/replicator.js#L239) objects representing the peers that are sharing this drive.

Useful in many cases, but most often to check if the drive is connected to other peers after trying to find peers through a discovery network like Hyperswarm. `drive.peers.length > 0`.

#### `drive.online`

Equivalent to `drive.peers.length > 0`. Useful to check if you are getting updates from other peers or working with cached data.

#### `drive.replicate()`

Creates a replication stream that is capable of replicating the metadata and content cores at the same time.

Available before the drive is ready.

Same as `drive.store.replicate()`, more about [corestore.replicate](https://github.com/hypercore-protocol/corestore-next#const-stream--storereplicateopts)

#### `drive.findingPeers()`

Returns a callback that informs this.update() that peer discovery is done, more at [Hypercore.findingPeers](https://github.com/hypercore-protocol/hypercore-next/#const-done--corefindingpeers).

#### `const updated = await drive.update()`

Wait for the drive to try and find a signed update to it's metadata core's length. Does not download any data from peers except for a proof of the new metadata's core length.

If the metadata's core length is updated it will return `true`.

If the drive does not have a `drive.content` already (a clone), it will try to read the Content's core key from `drive.headers` to resolve the content as well.

#### `await drive.put(key, content, [options])`

Put an object by a string key, Buffer content, and optionally metadata.

`options` include:

```js
{
  metadata: {...} // By default metadata is a json object.
}
```

#### `await drive.get(key)`

Returns the object's content corresponding to a given key. If `drive.online` is false it will try to read the data from storage if it exists, otherwise it will return `null`

#### `await drive.entries([opts])`

Get all entries as Hyperbee nodes. Takes Hyperbee createReadStream [options](https://github.com/hypercore-protocol/hyperbee#stream--dbcreatereadstreamoptions), plus `prefix` if you want entries that starts with a given string.

#### `for await (const entry of drive) {}`

SlashDrive is asyncIterator, you can use `for await` to asynchronusly get all the objects in the drive.

#### `await drive.list([prefix, options])`

Returns an array of the metadata of the objects with keys starting with a given prefix

```js
[
  {
    key: 'somekey',
    metadata: { contentLength, ...userMetadata },
    content: Uint8Array,
  },
];
```

`options` include:

```
{
  metadata: false; // whether or not include object's metadata
  content: false; // whether or not include content of the object (be careful with big content)
}
```

#### `await drive.download()`

Continously Download the drive's metadata and content.

#### `drive.on('update', ({ key, type }) => {})`

Emitted when the metadata or the content of an object is updated.

- `type` is the operation type, can be `'put'` or `'del'`.
