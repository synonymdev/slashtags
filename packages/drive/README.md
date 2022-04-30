# slashdrive

SlashDrive is a simple, secure, realtime distributed Object-storage-like system optimized for p2p sharing.

SlashDrive consists of two Append-only logs, one for storing objects metadata, and the other holds the blobs of data, allowing p2p sharing of metadata without the overhead of sharing the contents as well.

SlashDrive is based on Hypercore and is designed with Hyperswarm p2p discovery in mind.

## Installation

```
npm install @synonymdev/slashdrive corestore@next
```

## Usage

```js
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';

// Create a local drive using a name and Corestore instance
const drive = new SlashDrive({
  name: 'foo',
  store: new Corestore('/path/to/storage/dir/'),
  encrypted: true,
});
await drive.ready();

// Setup Discovery
const swarm = new Hyperswarm();
swarm.on('conneciton', (conn) => drive.replicate(conn));

await swarm.join(drive.discoveryKey).flushed();

// Write an object
await drive.put('foo', b4a.from(JSON.stringify({ name: 'Alice' })));

// Share your drive data
const driveDetails = {
  key: drive.key,
  encryptionKey: drive.encryptionKey,
};
```

```js
// Peers trying to read your drive now can do the following
import Corestore from 'corestore';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';

const remoteDrive = new SlashDrive({
  store: new Corestore('/path/to/storage/dir/'),
  ...driveDetails,
});
await remoteDrive.ready();

// Setup discovery in the remote node
const swarm = new Hyperswarm();
swarm.on('conneciton', (conn) => drive.replicate(conn));

swarm.join(drive.discoveryKey);

// Wait for the first peers
const done = remoteDrive.findingPeers();
swarm.flush().then(done, done);

await remoteDrive.update();

await remoteDrive.get('foo');
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

#### `await drive.ready()`

Wait for the core to fully open.

After this has called, the `this.discoveryKey` and other properties have been set.

In general you do NOT need to wait for ready, unless checking a synchronous property, as all internals await this themselves.

#### `drive.key`

Buffer containing the public key identifying this core.

#### `drive.discoveryKey`

Buffer containing a key derived from the metadata's core's public key. In contrast to core.key this key does not allow you to verify the data but can be used to announce or look for peers that are sharing the same drive, without leaking the core key.

#### `drive.encryptionKey`

Buffer containing the optional encryption key for this drive.

#### `await drive.findingPeers()`

Returns a callback that informs this.update() that peer discovery is done, more at [Hypercore.findingPeers](https://github.com/hypercore-protocol/hypercore-next/#const-done--corefindingpeers).

#### `const updated = await drive.update()`

Wait for the drive to try and find a signed update to it's metadata core's length. Does not download any data from peers except for a proof of the new metadata's core length.

If the metadata's core length is updated it will return `true`.

If the drive is not writable, it will also try to read the Content's core key from `this.headers` to resolve the content as well.

If it failed to find any peers, or couldn't retrieve the headers needed to find the Content's core, it will throw an error.

If the remote drive is encrypted or corrupt, it will throw a different error for that case as well.

#### `drive.replicate()`

Creates a replication stream that is capable of replicating the metadata and content cores at the same time.

Same as `drive.store.replicate()`, more about [corestore.replicate](https://github.com/hypercore-protocol/corestore-next#const-stream--storereplicateopts)

#### `await drive.put(key, content, [options])`

Put an object by a string key, Buffer content, and optionally metadata.

`options` include:

```js
{
  metadata: {
  } // By default metadata is a json object.
}
```

#### `await drive.get(key)`

Returns the object's content corresponding to a given key.

#### `await drive.list(prefix)`

Returns an array of the metadata of the objects with keys starting with a given prefix

```js
[{ key: 'somekey', metadata: { contentLength, ...userMetadata } }];
```
