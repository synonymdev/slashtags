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
const store = new DriveStore(corestore, keyPair)

const publicDrive = store.get('public'); // or store.get()

const privateDrive = store.get('foo'); // returns an encrypted Hyperdrive
```

## API

#### `const drivestore = new DriveStore(corestore, keyPair)`

Create new Drivestore. 

- `corestore` must be an instance of [Corestore](https://github.com/hypercore-protocol/corestore).
    
  If the instance is a [namespace](https://github.com/hypercore-protocol/corestore#const-store--storenamespacename), the internal corestore will reset its namespace to the `DEFAULT_NAMESPACE` (32 0-bytes).

- `keyPair` public and secret keys to create the public Hyperdrive, the secret key will be used as the `primaryKey` for the internal corestore.

#### `await drivestore.ready()`

Awaits opening metadata hypercore. Useful before [async iterating](#for-await-let-name-of-drivestore) over all created drives.

#### `const hyperdrive = drivestore.get([name])`

Returns an encrypted [Hyperdrive](https://github.com/hypercore-protocol/hyperdrive-next) for a given name.

If `name` is undefined or equal to `/public` it will return a public unencrypted drive, by the same keypair passed to the contsructor.

#### `const stream = drivestore.replicate(stream)`

Same as [drivestore.corestore.replicate(stream)](https://github.com/hypercore-protocol/corestore#const-stream--storereplicateoptsorstream)
