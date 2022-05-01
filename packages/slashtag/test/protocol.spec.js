import c from 'compact-encoding'

import { expect } from 'aegir/utils/chai.js'
import { Slashtag, SlashtagProtocol } from '../src/index.js'
import { swarmOpts } from './helpers/swarmOpts.js'

const dhtOpts = swarmOpts()

class Foo extends SlashtagProtocol {
  static get protocol () {
    return 'foo'
  }

  get messages () {
    const self = this
    return [
      {
        name: 'messageA',
        encoding: c.string,
        onmessage: self.messageA.bind(self)
      }
    ]
  }

  messageA (message) {
    this.emit('message', message)
  }

  async request (key) {
    const { channel, connection } = await this.connect(key)
    channel.messages[0].send(this.protocol)
    return { channel, connection }
  }
}

class Bar extends Foo {
  static get protocol () {
    return 'bar'
  }
}

describe('protocol', () => {
  it('should register a protocol in an idempotent way', () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts,
      protocols: [Bar]
    })

    const fooFirst = alice.protocol(Foo)
    const fooSecond = alice.protocol(Foo)

    const barFirst = alice._protocols.get(Bar.protocol)
    const barSecond = alice.protocol(Bar)

    expect(fooFirst).to.eql(fooSecond)
    expect(barFirst).to.eql(barSecond)
  })

  it('should register and multiplex multiple protocol over the same connection', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts,
      protocols: [Foo, Bar]
    })
    const AliceFoo = alice.protocol(Foo)
    const AliceBar = alice.protocol(Bar)

    expect(AliceFoo).to.be.instanceOf(Foo)
    expect(AliceBar).to.be.instanceOf(Bar)

    expect(AliceBar.slashtag).to.eql(AliceFoo.slashtag)

    await alice.listen()

    // // ===

    const bob = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts,
      protocols: [Foo, Bar]
    })

    const BobFoo = bob.protocol(Foo)
    const BobBar = bob.protocol(Bar)

    expect(BobFoo).to.be.instanceOf(Foo)
    expect(BobBar).to.be.instanceOf(Bar)

    expect(BobBar.slashtag).to.eql(BobFoo.slashtag)

    const foo = new Promise((resolve) => AliceFoo.on('message', resolve))
    const bar = new Promise((resolve) => AliceBar.on('message', resolve))

    const channelFoo = await BobFoo.request(alice.key)
    const channelBoo = await BobBar.request(alice.key)

    expect(channelBoo.connection).to.eql(channelFoo.connection)
    expect(channelBoo.peerInfo).to.eql(channelFoo.peerInfo)

    expect(await foo).to.eql('foo')
    expect(await bar).to.eql('bar')

    await alice.close()
    await bob.close()
  })
})