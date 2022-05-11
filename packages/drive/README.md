# slashdrive

SlashDrive is a simple, secure, realtime distributed Object-storage system optimized for p2p sharing.

SlashDrive consists of two Append-only logs, one for storing objects metadata, and the other holds the blobs of data, allowing p2p sharing of metadata without the overhead of sharing the contents as well.

SlashDrive is based on Hypercore and is designed with Hyperswarm p2p discovery in mind.

## Installation

```
npm install @synonymdev/slashdrive corestore@next
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

If it failed to find any peers, or couldn't retrieve the headers needed to find the Content's core, it will throw an error.

If the remote drive is encrypted or corrupt, it will throw a different error for that case as well.

#### `await drive.put(key, content, [options])`

Put an object by a string key, Buffer content, and optionally metadata.

`options` include:

```js
{
  metadata: {...} // By default metadata is a json object.
}
```

#### `await drive.get(key)`

Returns the object's content corresponding to a given key.

#### `await drive.list(prefix)`

Returns an array of the metadata of the objects with keys starting with a given prefix

```js
[{ key: 'somekey', metadata: { contentLength, ...userMetadata } }];
```

#### `drive.on('update')

Emitted when the metadata has been updataed.

Same as `drive.metadata.feed.on('append')` see [core.on('append')](https://github.com/hypercore-protocol/hypercore-next/#coreonappend)
