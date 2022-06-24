# Slashtags SDK

Software development kit for Slashtags

Slashtags and its ecosystem of dependencies consists of a many low level building blocks for p2p communication and data authoring in distributed applications.

This modular approach is great for managing complexity and ease of iteration, it makes it harder for consumers to build fully functional application.

This SDK offers a high level batteries-included abstraction layer for these low level building blocks.

If you are building a webapp over Slashtags, or adding Slashtags support to your existing wallet/application, this package is for you.

## Goals

- **Beginner friendly** Developing for p2p systems is hard, and this SDK is designed to implement best practices and optimization while avoiding common pitfalls.
- **Cross platform** This SDK tries to support all the major platforms and browsers.
- **Key management** Derive and manage all keyPairs and addresses in a from the same seed.
- **WoT support** As we develop and experiment with managing contacts, connections and shared data (attestation, reputation etc), this SDK will be updated to support those features out of the box.
- **Full featured** As Slashtags develop and higher level solutions and optimizations (storage services, relays, etc) are developed, this SDK will be updated to support them.

## Security

While deriving Slashtags from a mnemonic seed phrase is an important part of Slashtag's strategy for key management and decentralized identifier's long term success, it is important to note that this SDK _does not_ require access to the mnemonic seed phrase or the master private key that secures other assets.

Rather your application needs to derive a `primaryKey` first as defined in the [Key Derivation](../../specs/slashtags-key-derivation.md) spec, then pass it in the `primaryKey` field of the `SDK.init()` static method.

You can see an example of how to derive a `primaryKey` from a mnemonic seed phrase in Javascript [examples/primarykey/](../../examples/primarykey/).

## Install

```bash
npm install @synonymdev/slashtags-sdk
```

## Usage

```js
import { SDK } from '@synonymdev/slashtags-sdk';

const sdk = await SDK.init();
```

or in Commonjs

```js
async function main() {
  const { SDK } = await import('@synonymdev/slashtags-sdk');
  const sdk = await SDK.init();
}
```

### Examples

Check the [examples](../../examples/) directory to learn more about how to use the SDK.

## API

#### `const sdk = await SDK.init([options])`

Create a new SDK instance.

`options` is an object that includes:

- `primaryKey`

  - optional 32 bytes used to derive all the keyPairs for Slashtags and their components, if not provided, a random on will be generated.

- `swarmOpts`

  - Options passed to the Hyperswarm node
  - Includes:
    - `bootstrap` A list of bootstrap nodes, useful for running a testnet
    - `relays` A list of websocket [DHT relays](https://github.com/hyperswarm/dht-relay), useful for running the SDK in browser.

- `storage`:

  - A path to the storage directory, defaults to `${homedir()}/.slashtags/` in home directory, or a [Random Access Storage](https://github.com/random-access-storage/random-access-storage) instance.

- `persist`:

  - whether to persist storage to disk, defaults to true, if false, storage will be in-memory only.

- `protocols`:

  - List of Slashtags [protocols](../slashtag/README.md#slashprotocol) to register on every Slashtag created by the SDK

#### `sdk.slashtag([options])`

Create a [Slashtag](../slashtag/) instance.

`options` includes the same options for `Slashtag` constructor, with the following additions:

- `name` Create a Slashtag with a name. see how the keyPairs are derived from that name and the SDK `primaryKey` [here](../../specs/slashtags-key-derivation.md)
- `key` Create a remote Slashtag with a key.
- `url` Create a remote Slashtag with a [SlashURL](../slashtag/README.md#slashurl).

If neither `options`, `options.name`, `options.key`, nor `options.url` were provided it will return a default slashtag where the name used for derivation is an empty Buffer (no name).

#### `await sdk.close()`

Closes all Slahstags created by this SDK as well as any other resources managed by the SDK to enable graceful shutdown.

#### `SDK.protocols`

A map of all the builtin [SlashProtocols](../slashtag/README.md#slashprotocol) that are available in the SDK by default.

Useful to access the builtin protocols registered on a Slashtag instance, for example:

```js
const auth = alice.protocol(SDK.protocols.SlashAuth);
```

Or access the static methods of the builtin protocols:

```js
SDK.protocols.SlashAuth.formatURL(url);
```

## Contribution and Feature requests

We aim to develop this SDK iteratively and keep the API minimal until we learn what consumers of the SDK want to achieve the most.

So don't hesitate to open an issue or pull request if you have a feature request.
