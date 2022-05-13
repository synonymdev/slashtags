# Slashtag

Slashtag is the identity layer of Slashtags protocol, that enables attaching metadata to a keypair, and enables p2p communications between peers.

This module creates a node that manages a Slashtag's [drives](../drive/), p2p connections, and multiplexes all the registered [protocols](#slashprotocol) over these secure connections.

Slashtag instance combines [Hyperswarm v3](https://www.npmjs.com/package/hyperswarm), and [Corestore v6](https://www.npmjs.com/package/corestore) to manage DHT connections, Hypercore discovery and storage.

## Features

- **DHT connection** listen and connect to other Slashtags through a secure connection, without the need for DNS or SSL certificates.
- **Extensible protocols** augment p2p connections with custom wire protocols.
- **Public Drive** for sharing public, discoverable metadata about a keypair.
- **Private Drives** Create private encrypted drives for sharing private data with anyone with the right keys.

## Installation

```
npm install @synonymdev/slashtag
```

## Usage

Quick example showing how to create a Slashtag node and use it to create resolvable public profile.

```js
import { Slashtag } from '@synonymdev/slashtag';

// Create a new Slashtag node
const alice = new Slashtag({
  keyPair: Slashtag.createKeyPair(),
});
// Set the public profile on the public drive
await alice.setProfile({ name: 'Alice' });

// Resolve Alice's public profile
const remoteAlice = new Slashtag({ url: alice.url.toString() });
// Resolve Alice's public profile
const profile = await remoteAlice.getProfile();
console.log(profile); //==> { name: 'Alice' }
```

## API

#### `const drive = new SlashDrive(options)`

Make a new Slashtag node.

`options` include:

```js
{
  url: 'slash://abc...123', // optional url of the read-only Slashtag node.
  key: k, // optional key of the read-only Slashtag node.
  keyPair: kp, // optional keyPair of the Slashtag node.
  store: store, // optional Corestore instance. won't be closed on slashtag.close()
  swarm: swarm, // optional hyperswarm instance. only applicable for remote Slashtags.
  protocols: [...], // optional list of SlashProtocols to register.
  swarmOpts: {bootstrap, relays}, // optional options for hyperswarm instance.
}
```

You need to pass at least one of `url`, `key`, or `keyPair`.

#### `Slashtag.createKeyPair([primaryKey, name])`

Static method to create a keyPair from optional primary key and a name. See the [key derivation spec](../../specs//slashtags-key-derivation.md)

#### `await slashtag.ready()`

Wait for the node to fully open.

After `ready()` has been called, the Hyperswarm node and publicDrive are ready to use.

In general you do NOT need to wait for ready, unless checking a synchronous property, as all internals await this themselves.

#### `slashtag.url`

A [SlashURL](#slashurl) instance created from the public key of the slashtag.

#### `slashtag.remote`

A boolean, true if the slashtag is a remote (read-only) Slashtag created without KeyPair.

#### `slashtag.publicDrive`

The public [drive](../drive/) of the slashtag.

#### `await slashtag.listen()`

Same as `slashtag.swarm.listen()`, listens on the Slashtag's public key. For more information on [Hyperswarm p2p servers](https://github.com/hyperswarm/dht#creating-p2p-servers)

#### `await slashtag.connect(destination)`

Connect to a Slashtag's server. `destination` can be either the public key, a SlashURL, or a URL string.

Returns a promise of [Encrypted Connection](https://github.com/hyperswarm/secret-stream).

#### `slashtag.protocol(Protocol)`

Registers a protocol if it wasn't already. Returns the protocol instance registered for this instance of Slashtag.

`Protocol` has to bea class that extends [SlashProtocol](#slashprotocol).

#### `await slashtag.setProfile(profile)`

A helper method to set a JSON object on the public drive at `profile.json`, representing the Profile metadata of the Slashtag.

#### `await slashtag.getProfile()`

A helper method for retrieving the profile metadata from the public drive.

#### `await slashtag.drive(opts)`

Creates a private [drive](../drive/), or returns a read-only drive if no `opts.key` is provided instead of `opts.name` or `opts.keyPair`.

`options` include:

```js
{
  name: string, // optional name for the private drive.
   keyPair: kp, // optional keyPair of the private drive.
  encrypted: boolean, // optional whether the drive should be encrypted.
   key: k, // optional key of a remote private drive.
   encryptionKey: ek, // optional key decrypting a remote private drive.
}
```

#### `await slashtag.close()`

Destroys the Hyperswarm node, and closes the Corestore instance.

#### `slashtag.on('connection', (socket, peerInfo) => {})

Emitted whenever the swarm connects to a new peer.

- `socket` is an end-to-end (Noise) encrypted Duplex stream
- `peerInfo` is a [PeerInfo](#peerinfo-api) instance

## SlashURL

Extends [URL](https://nodejs.org/api/url.html#the-whatwg-url-api) with the following features:

- Supports `slash://` and other Slashtags specific protocols.
- `url.slashtag` getter returns the "hostname" of the URL (slashtag public key) in multiple formats:
  - `url.slashtag.key`: Uint8Array.
  - `url.slashtag.base32`: base32 encoded string.

## SlashProtocol

Slashtags connection can multiplex multiple message oriented protocols over a stream using [protomux](https://github.com/mafintosh/protomux), allowing extending the wire protocol in a modular way.

SlashProtocol is a base class allowing protocols to be easily registered on a Slashtag node and have access to few helper methods.

Each protocol needs to implement a static getter `protocol` with its unique name.

### Methods:

Methods available on all protocols that extends SlashProtocol:

#### `protocol.connect(destination)`

Each SlashProtocol instance has access to this method and it returns `{connection, channel}`

Where:

- `connection` is a [Encrypted Connection](https://github.com/hyperswarm/secret-stream).
- `channel` extends the protomux's [channel]() with the following:
  - `channel.peerInfo` [peerInfo](#peerinfo-api)

### example

```js
class Foo extends SlashProtocol {
  // Protocol unique name
  static get protocol() {
    return 'foo';
  }

  // List of messages
  get messages() {
    const self = this;
    return [
      {
        name: 'messageA',
        encoding: c.string,
        onmessage: self.messageA.bind(self),
      },
    ];
  }

  messageA(message) {
    this.emit('message', message);
  }

  // Custom methods
  async request(key) {
    const { channel, connection } = await this.connect(key);
    channel.messages[0].send(this.protocol);
    return { channel, connection };
  }
}

// Get the protocol instance
const foo = slashtag.protocol(Foo);
await foo.request(key);
```

## PeerInfo API

Extends Hyperswarm's [PeerInfo](https://github.com/hyperswarm/hyperswarm#peerdiscovery-api) with the following:

- `peerInfo.slashtag` a read-only Slashtag instance of the remote peer.
