# slashtags-sdk

The software development kit for the Slashtags protocol. 

This SDK offers a high-level, batteries-included abstraction layer for the lower level building blocks.

If you are building a webapp over Slashtags, or adding Slashtags support to your existing wallet/application, this package is for you.

## Goals

- **Beginner friendly** Developing P2P applications is hard. This SDK is designed to implement best practices and optimizations that help avoid common pitfalls.
- **Cross platform** This SDK tries to support all the major platforms and browsers.
- **Key management** Derive and manage all keyPairs and addresses from the same seed.
- **WoT support** As we develop and experiment with managing contacts, connections, and shared data (attestation, reputation, etc), this SDK will be updated to support those features out of the box.
- **Full featured** As Slashtags develops and higher level solutions and optimizations (storage services, relays, etc) are developed, this SDK will be updated to support them.

## Security

While deriving Slashtags from a series of BIP-39 mnemonic words is an important part of the protocol's strategy for key management and the long-term success of decentralized identifiers, it is important to note that this SDK _does not_ require access to the series of mnemonic words or the master private key that secures your bitcoin.

Instead, your application needs to derive a `primaryKey` first as defined in the [Key Derivation](../../specs/slashtags-key-derivation.md) spec, and then pass it in the `primaryKey` field of the `SDK.init()` static method.

See how to derive `primaryKey` from a mnemonic seed phrase in Javascript: [examples/primarykey/](../../examples/primarykey/).

## Installation

```
npm install @synonymdev/slashtags-sdk
```

## Usage

```js
import SDK from '@synonymdev/slashtags-sdk'
import c from 'compact-encoding'

const sdk = new SDK()

const alice = sdk.slashtag() // return the default slashtag
const drive = alice.drivestore.get() // returns the /public drive

await drive.put('/profile.json', c.encode(c.json, {name: 'alice'}))

await sdk.swarm.flush() // await for the public drive to be announced

const sdk2 = new SDK()

const clone = sdk2.drive(drive.key) 

const profile = await clone.get('/profile.json').then(b => b && c.decode(c.json, b))
```

## Browser support

Browsers don't allow for raw sockets, so you will need to run a [DHT Relay](https://github.com/hyperswarm/dht-relay) somewhere and connect it to the SDK.

Easiest way to run a local relay is through the [CLI](../cli/) module. Execute the following commands:

```bash
npm i -g @synonymdev/slasthags-cli

slash daemon start
```
Then in the browser, execute the following:

```js
const sdk = new SDK({ relay: 'ws://localhost:45475'});
```

See further the following [browser example](../../examples/browser)

## API

#### `const sdk = new SDK([options])`

Creates a new SDK instance.

`options` is an object that includes the following:

- `primaryKey` Optional 32 bytes used to derive all the keyPairs for Slashtags and their components; if not provided, a random one will be generated.
- `bootstrap` A list of bootstrap nodes, useful for running a testnet.
- `relay` A websocket [DHT relay](https://github.com/hyperswarm/dht-relay), useful for running the SDK in the browser, or routing connection through a different IP.
- `storage` A path to the storage directory, defaults to `${homedir()}/.slashtags/` in the home directory, or a [Random Access Storage](https://github.com/random-access-storage/random-access-storage) instance in the browser.

#### `const slashtag = new sdk.slashtag([name])`

Creates a slasthag instance using a name. If no name is given it returns the [default Slashtag](../../specs/slashtags-key-derivation.md).

#### `const drive = new sdk.drive(key)`

Creates a read-only Hyperdrive session, and internally joining its discovery key as a client if not already joined.

#### `await sdk.close()`

Closes all Slahstags created by this SDK as well as any other resources managed by the SDK to enable graceful shutdown.

#### `constants.PRIMARY_KEY_DERIVATION_PATH `

Derivation path for generating a PrimaryKey from a Bitcoin seed.

```js
import bip39 from 'bip39'
import { BIP32Factory as bip32 } from 'bip32'
import * as ecc from 'tiny-secp256k1'
import SDK, { constants } from '@synonymdev/slashtags-sdk'

const seed = await bip39.mnemonicToSeed(mnemonic)
const root = bip32(ecc).fromSeed(seed) // Network: bitcoin mainnet
const primaryKey = root.derivePath(constants.PRIMARY_KEY_DERIVATION_PATH).privateKey

const sdk = new SDK({ primaryKey })
```

#### `constants.MNEMONIC_TO_PRIMARY_KEY_TEST_VECTORS`

Test vectors to make sure your wallet generates the correct primary key from menemonic phrase.
