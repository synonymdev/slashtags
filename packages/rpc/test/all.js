const test = require('brittle')
const Slashtag = require('@synonymdev/slashtag')
const createTestnet = require('@hyperswarm/testnet')
const c = require('compact-encoding')
const z32 = require('z32')
const DHT = require('hyperdht')
const b4a = require('b4a')

const SlashtagsRPC = require('../index.js')

class Foo extends SlashtagsRPC {
  get id () {
    return 'foo'
  }

  get valueEncoding () {
    return c.string
  }

  get handshakeEncoding () {
    return c.string
  }

  /** @param {import('@hyperswarm/secret-stream')} socket */
  handshake (socket) {
    return this.id + '-handshake:for:' + z32.encode(socket.remotePublicKey)
  }

  /**
   * @param {string} handshake
   * @param {import('@hyperswarm/secret-stream')} socket
   */
  onopen (handshake, socket) {
    this.emit('handshake', handshake, z32.encode(socket.remotePublicKey))
  }

  get methods () {
    const self = this
    return [
      {
        name: 'echo',
        handler: self._onEcho.bind(self)
      }
    ]
  }

  /** @param {string} req */
  _onEcho (req) {
    this.emit('echo', req)
    return req
  }

  /**
   *
   * @param {Uint8Array} key
   * @param {string} message
   * @returns
   */
  async echo (key, message) {
    const rpc = await this.rpc(key)
    return rpc?.request('echo', message)
  }
}

class Bar extends Foo {
  get id () {
    return 'bar'
  }
}

test('missing id', async t => {
  const testnet = await createTestnet(1, t.teardown)
  const alice = new Slashtag(testnet)

  class MissingID extends SlashtagsRPC { }

  const instance = new MissingID(alice)
  // @ts-ignore
  await t.exception(() => instance.setup({}), /id should be defined/)

  alice.close()
})

test('basic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const aliceFoo = new Foo(alice)
    ; (() => {
    // Multiple instances shouldn't create any issues
    return new Foo(alice)
  })()
  const bobFoo = new Foo(bob)

  await alice.listen()

  const ht = t.test('handshake')
  ht.plan(4)

  aliceFoo.on('handshake', (handshake, remoteID) => {
    ht.is(handshake, 'foo-handshake:for:' + alice.id, 'correct handshake')
    ht.is(remoteID, bob.id, 'emit handshake event correctly')
  })

  bobFoo.on('handshake', (handshake, remoteID) => {
    ht.is(handshake, 'foo-handshake:for:' + bob.id, 'correct handshake')
    ht.is(remoteID, alice.id, 'emit handshake event correctly')
  })

  aliceFoo.once('echo', req => t.is(req, 'foobar'))
  t.is(await bobFoo.echo(alice.key, 'foobar'), 'foobar')

  aliceFoo.once('echo', req => t.is(req, 'foobar 2'))
  t.is(await bobFoo.echo(alice.key, 'foobar 2'), 'foobar 2')

  await ht

  await alice.close()
  await bob.close()
})

test('multiple rpcs', async t => {
  const testnet = await createTestnet(3, t.teardown)

  t.plan(6)

  const alice = new Slashtag(testnet)
  const aliceFoo = new Foo(alice)
  const aliceBar = new Bar(alice)

  const bob = new Slashtag(testnet)
  const bobFoo = new Foo(bob)
  const bobBar = new Bar(bob)

  await alice.listen()

  aliceFoo.on('handshake', handshake =>
    t.is(handshake, 'foo-handshake:for:' + alice.id)
  )

  aliceBar.on('handshake', handshake =>
    t.is(handshake, 'bar-handshake:for:' + alice.id)
  )

  aliceFoo.once('echo', req => t.is(req, 'foo'))
  t.is(await bobFoo.echo(alice.key, 'foo'), 'foo')

  aliceBar.once('echo', req => t.is(req, 'bar'))
  t.is(await bobBar.echo(alice.key, 'bar'), 'bar')

  await alice.close()
  await bob.close()
})

test('rpc - missing slashtag', async t => {
  const foo = new Foo()
  await t.exception(() => foo.rpc(b4a.from('a'.repeat(64), 'hex')), /Can not call rpc\(\) if not initialized with a Slashtag instance/)
})

test('use without slashtags', async t => {
  t.plan(2)

  const alice = new DHT()
  const server = alice.createServer()
  await server.listen()

  const aliceFoo = new Foo()

  server.on('connection', (/** @type {*} */ stream) => {
    aliceFoo.setup(stream)
  })

  aliceFoo.on('echo', (req) => {
    t.is(req, 'hello world')
  })

  const bob = new DHT()
  const bobFoo = new Foo()

  const stream = bob.connect(server.address().publicKey)
  await stream.opened

  const rpc = bobFoo.setup(stream)
  const response = await rpc?.request('echo', 'hello world')
  t.is(response, 'hello world')

  await alice.destroy()
  await server.close()
  await bob.destroy()
  await stream.destroy()
})
