const test = require('brittle')
const Slashtag = require('@synonymdev/slashtag')
const createTestnet = require('@hyperswarm/testnet')
const c = require('compact-encoding')
const b4a = require('b4a')
const Hyperswarm = require('hyperswarm')

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
    return this.id + '-handshake:for:' + b4a.toString(socket.remotePublicKey, 'hex')
  }

  /**
   * @param {string} handshake
   * @param {import('@hyperswarm/secret-stream')} socket
   */
  onopen (handshake, socket) {
    this.emit('handshake', handshake, socket.remotePublicKey)
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

test('hyperswarm - basic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Hyperswarm(testnet)
  const bob = new Hyperswarm(testnet)

  const aliceFoo = new Foo({ swarm: alice })
    ; (() => {
    // Multiple instances shouldn't create any issues
    return new Foo({ swarm: alice })
  })()
  const bobFoo = new Foo({ swarm: bob })

  await alice.listen()

  const ht = t.test('handshake')
  ht.plan(4)

  aliceFoo.on('handshake', (handshake, remoteID) => {
    ht.is(handshake, 'foo-handshake:for:' + b4a.toString(alice.keyPair.publicKey, 'hex'), 'correct handshake')
    ht.alike(remoteID, bob.keyPair.publicKey, 'emit handshake event correctly')
  })

  bobFoo.on('handshake', (handshake, remoteID) => {
    ht.is(handshake, 'foo-handshake:for:' + b4a.toString(bob.keyPair.publicKey, 'hex'), 'correct handshake')
    ht.alike(remoteID, alice.keyPair.publicKey, 'emit handshake event correctly')
  })

  aliceFoo.once('echo', req => t.is(req, 'foobar'))
  t.is(await bobFoo.echo(alice.keyPair.publicKey, 'foobar'), 'foobar')

  aliceFoo.once('echo', req => t.is(req, 'foobar 2'))
  t.is(await bobFoo.echo(alice.keyPair.publicKey, 'foobar 2'), 'foobar 2')

  await ht

  await alice.destroy()
  await bob.destroy()
})

test('hyperswarm - multiple rpcs', async t => {
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
    t.is(handshake, 'foo-handshake:for:' + b4a.toString(alice.keyPair.publicKey, 'hex'))
  )

  aliceBar.on('handshake', handshake =>
    t.is(handshake, 'bar-handshake:for:' + b4a.toString(alice.keyPair.publicKey, 'hex'))
  )

  aliceFoo.once('echo', req => t.is(req, 'foo'))
  t.is(await bobFoo.echo(alice.key, 'foo'), 'foo')

  aliceBar.once('echo', req => t.is(req, 'bar'))
  t.is(await bobBar.echo(alice.key, 'bar'), 'bar')

  await alice.close()
  await bob.close()
})
