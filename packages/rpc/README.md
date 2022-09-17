# rpc

helper module for creating RPCs using Slashtags nodes

## Installation

```
npm install @synonymdev/slashtags-rpc
```

## Usage

```js
import Slashtag from '@synonymdev/slashtag';
import c from 'compact-encoding';

class Foo extends SlashtagsRPC {
  get id() {
    return 'foo';
  }

  get valueEncoding() {
    return c.string;
  }

  get handshakeEncoding() {
    return c.string;
  }

  handshake(stream) {
    return this.id + '-handshake:for:' + socket.remotePublicKey.toString('hex');
  }

  onopen(handshake, stream) {
    this.emit('handshake', handshake, socket.reomtePublicKey);
  }

  get methods() {
    const self = this;
    return [
      {
        name: 'echo',
        handler: self._onEcho.bind(self)
      }
    ]
  }

  _onEcho (req) {
    this.emit('echo', req)
    return req
  }

  async echo (key, message) {
    const rpc = await this.rpc(key)
    return rpc?.request('echo', message)
  }
}

const alice = new Slashtag();
await alice.listen();

const aliceFoo = new Foo(alice);
aliceFoo.on('echo', (req) => { // req should equal 'hello world' })

const bob = new Slashtag();
const bobFoo = new Foo(bob);

const response = await bobFoo.echo(alice.key, 'hello world');
// response should equal 'hello world'
```

#### Use without Slashtag

If the RPC doesn't reuqire Slashtag for anything other than establish a connection, you can pass your own stream:

```js
const alice = new DHT();
const server = alice.createServer()
await server.listen();

const aliceFoo = new Foo();
server.on('connection', (stream) => aliceFoo.setup(stream))
aliceFoo.on('echo', (req) => {
  // req = 'hello world'
})

const bob = new DHT();
const bobFoo = new Foo();
const stream = bob.connect(server.address().publicKey)
await stream.opened

const rpc = bobFoo.setup(stream)
const response = await rpc?.request('echo', 'hello world')
// response = 'hello world'
```

## API

#### `id`

String identifies your RPC protocol.

#### `valueEncoding`

Default [compact encoding](https://github.com/compact-encoding/compact-encoding) for all requests and responses.

#### `handshakeEncoding`

Default [compact encoding](https://github.com/compact-encoding/compact-encoding) for handshake message, sent first thing on opening the channel.

#### `handshake(stream) => any`

A callback function that should returns the handshake value. `stream` is a [SecretStream](https://github.com/hyperswarm/secret-stream).

#### `onopen(handshake, stream)`

A callback on opening the rpc. `handshake` is the value sent on opening the channel, `stream` is a [SecretStream](https://github.com/hyperswarm/secret-stream).

#### `methods`

An array of methods objects that should be as following:

```js
{
    name: string,
    options?: {
        // Optional encoding for both the request and response
        valueEncoding: Encoding,
        // Optional encoding for requests
        requestEncoding: Encoding,
        // Optional encoding for responses
        responseEncoding: Encoding
    },
    // Handler that takes the decoded request and returns a response value
    handler: (req) => any
}
```

#### `rpc(key)`

Returns a [ProtomuxRPC](https://www.npmjs.com/package/protomux-rpc) instance after connecting to a Slashtag by its key, id or url. If connection is already opened, the same RPC instance is returned.

Internally, it uses `Slashtags.connect(key)` then sets up the RPC instance using `setup(stream)`

#### `setup(stream)`

Create a new [ProtomuxRPC](https://www.npmjs.com/package/protomux-rpc) instance on any stream if doesn't already exist, otherwise it will return the existing RPC.
