# slashtags-sdk

> Software development kit for creating and managing Slashtags

## Install

```bash
npm install @synonymdev/slashtags-sdk
```

## API

#### `const sdk = await SDK.init([options])`

Create a new SDK instance, managing storage, Hypercores, DHT, and Hyperswarms, as well as keyManager.

`options` include:

```js
{
  seed: Buffer, // 32 bytes seed used to derive all the keyPairs for Slashtags and their components
  relays: [] // Array of websocket relay addresses, needed for browser environments
}
```

#### `const slashtag = sdk.slashtag([options])`

Creates a new Slashtag instance

`options` include:

```js
{
  name: string, // a string used to generate the same Slashtag keyPair given the same seed in the SDK
  url: string, // if no name is provided, a remote/readonly Slashtag can be created from a url
}
```

#### `await slashtag.ready()`

Awaits for the internal SlashDrive to be ready.

#### `await slashtag.setProfile(profile)`

Adds a json profile to the Slashtag drive at `/profile.json`.

#### `await slashtag.getProfile()`

Returns a profile from the Slashtag drive at `/profile.json`.

#### `await slashtag.listen()`

Alias to `slashtag.swarm.listen()`

#### `await slashtag.connect(key)`

Connects to a Slashtag by its `key` and returns a connection

#### `on('connection', (socket, peerInfo) => {})`

Emitted whenever the swarm connects to a new peer.

`socket` is an end-to-end (Noise) encrypted Duplex stream

`peerInfo` is a [`PeerInfo`](https://github.com/hyperswarm/hyperswarm/blob/v3/README.md#peerinfo-api) instance, with a `peerInfo.slashtag` property, for the remote peer's Slashtag.

#### `const protocol = slashtag.registerProtocol(Protocol)`

Adds a [Protomux](https://github.com/mafintosh/protomux/) channel to incoming and outgoing connection.

`Protocol` a Class constructor that includes `Protocol.options` that conforms to the [Protomux](https://github.com/mafintosh/protomux/) `createChannel()` options.

Returns an instance of `Protocol` where functions can have access to messages at `const messages = connection.userData.channels.get(this.options.protocol)`.
