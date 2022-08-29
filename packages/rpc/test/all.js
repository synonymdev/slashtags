import test from 'brittle'
import Slashtag from '@synonymdev/slashtag'
import createTestnet from '@hyperswarm/testnet'
import c from 'compact-encoding'

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
    return this.id + '-handshake:for:' + socket.remoteSlashtag.id
  }

  onopen (handshake, socket) {
    this.emit('handshake', handshake, socket.remoteSlashtag)
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

  t.plan(8)

  const alice = new Slashtag(testnet)
  await alice.ready()
  const bob = new Slashtag(testnet)
  await bob.ready()

  const aliceFoo = new Foo(alice)
  ;(() => {
    // Multiple instances shouldn't create any issues
    return new Foo(alice)
  })()
  const bobFoo = new Foo(bob)

  await alice.listen()

  aliceFoo.on('handshake', (handshake, remoteSlashtag) => {
    t.is(handshake, 'foo-handshake:for:' + alice.id)
    t.is(remoteSlashtag.id, bob.id)
  })

  bobFoo.on('handshake', (handshake, remoteSlashtag) => {
    t.is(handshake, 'foo-handshake:for:' + bob.id)
    t.is(remoteSlashtag.id, alice.id)
  })

  aliceFoo.once('echo', req => t.is(req, 'foobar'))
  t.is(await bobFoo.echo(alice.key, 'foobar'), 'foobar')

  aliceFoo.once('echo', req => t.is(req, 'foobar 2'))
  t.is(await bobFoo.echo(alice.key, 'foobar 2'), 'foobar 2')

  alice.close()
  bob.close()
})

test('multiple rpcs', async t => {
  const testnet = await createTestnet(3, t.teardown)

  t.plan(6)

  const alice = new Slashtag(testnet)
  await alice.ready()
  const aliceFoo = new Foo(alice)
  const aliceBar = new Bar(alice)

  const bob = new Slashtag(testnet)
  await bob.ready()
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

  alice.close()
  bob.close()
})

test('one sided channel', async t => {
  const testnet = await createTestnet(3, t.teardown)

  t.plan(1)

  const alice = new Slashtag(testnet)
  const bob = new Slashtag(testnet)

  await alice.listen()

  const bobFoo = new Foo(bob)

  bobFoo.echo(alice.key, 'foo').catch(error => {
    t.is(error.message, 'channel closed')
  })

  alice.close()
  bob.close()
})
