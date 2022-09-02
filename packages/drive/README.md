# slashdrive

DriveStore is a Hyperdrive factory that makes it easier to manage large collections of named Hyperdrives.

## Features

- Public unencrypted drive
- Creates and keep track of all created encrypted private drives

## Installation

```
npm install @synonymdev/slashdrive
```

## Usage

```js
const store = new DriveStore({ corestore, keyPair });

const publicDrive = store.get('/public'); // or store.get()

const privateDrive = store.get('/foo'); // returns an encrypted Hyperdrive
```

## API

#### `const drivestore = new DriveStore(opts)`

Create new store.

`opts` are:

```
{
  corestore, // Corestore instance
  keyPair, // Hypercore keyPair
}
```

#### `await drivestore.ready()`

Awaits opening metadata hypercore. Useful before [async iterating](#for-await-let-path-of-drivestore) over all created drives.

#### `const hyperdrive = drivestore.get([path])`

Returns an encrypted [Hyperdrive](https://github.com/hypercore-protocol/hyperdrive-next) for a given path.

If `path` is undefined or equal to `/public` it will return a public unencrypted drive, by the same keypair passed to the contsructor.

#### `const stream = drivestore.replicate(stream)`

Same as [drivestore.corestore.replicate(stream)](https://github.com/hypercore-protocol/corestore#const-stream--storereplicateoptsorstream)

#### `await flush()`

Awaits writing all metadata updates to the underlying storage.

#### `await drivestore.close()`

Closes the drivestore after flushing.

#### `for await (let {path} of drivestore)`

Iterate over created drives from the metadata hyperbee.
