# Slashtag

Slashtag is the identity layer of Slashtags protocol, that enables attaching metadata to a keypair (through [Hyperdrives](https://github.com/hypercore-protocol/hyperdrive-next)), and p2p communications between peers.

This module creates a node that manages a Slashtag's [drives](../drive/), and facilitating p2p connections between slashtags.

## Installation

```
npm install @synonymdev/slashtag
```

## Usage

Quick example showing how to create a Slashtag node and use it to create resolvable public profile.

```js
import Slashtag from '@synonymdev/slashtag';

const alice = new Slashtag();
const bob = new Slashtag();

await alice.listen() // listen on alice's public key
await bob.connect(alice.key).opened
```

## API

#### `await slashtag.ready()`

Wait for the DHT node and Drivestore to be fully open.

In general you do NOT need to wait for ready, unless checking a synchronous property, as all internals await this themselves.

#### `slashtag.url`

A [SlashURL](../url/) string in the form `slash:<z-base-32 key>`.

#### `slashtag.drivestore`

[Drivestore](../drive/) instance for this slashtag.

#### `await slashtag.listen()`

Listen on the slashtag's public key through [Hyperswarm DHT p2p server](https://github.com/hyperswarm/dht#creating-p2p-servers)

#### `const socket = slashtag.connect(destination)`

Connect to a Slashtag's server. `destination` is the peer's public key, as a Buffer/Uint8Array, or encoded as a z-base-32 or [slash: url](../url/).

Returns a promise of [Encrypted Connection](https://github.com/hyperswarm/secret-stream).

You can `await socket.opened`. 

#### `await slashtag.close()`

Destroys the Hyperswarm node, and closes the Corestore instance.

#### `slashtag.on('connection', (socket) => {})

Emitted whenever the dht recieves a connection as a server or client.

`socket` is an end-to-end [NoiseSecretStream](https://github.com/hyperswarm/secret-stream)

