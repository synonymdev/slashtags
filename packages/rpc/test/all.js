import test from 'brittle'
import Slashtag from '@synonymdev/slashtag'
import createTestnet from '@hyperswarm/testnet'
import c from 'compact-encoding'
import z32 from 'z32'

import SlashtagsRPC from '../index.js'

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

  handshake (socket) {
    return this.id + '-handshake:for:' + z32.encode(socket.remotePublicKey)
  }

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

  class MissingID extends SlashtagsRPC {}

  const instance = new MissingID(alice)
  // @ts-ignore
  await t.exception(() => instance.setup({}))

  alice.close()
})

test('basic', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  const aliceFoo = new Foo(alice)
  ;(() => {
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
