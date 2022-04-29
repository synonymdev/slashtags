import b4a from 'b4a'
import c from 'compact-encoding'

import { expect } from 'aegir/utils/chai.js'
import { SlashtagProtocol } from '../src/index.js'
import { sdk } from './helpers/setup-sdk.js'

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
    const { channel } = await this.connect(key)
    channel.messages[0].send(this.protocol)
  }
}

class Bar extends Foo {
  static get protocol () {
    return 'bar'
  }
}

describe('protocols', () => {
  it('should register and multiplex multiple protocol over the same connection', async () => {
    const sdkA = await sdk()
    const alice = sdkA.slashtag({ name: 'alice' })
    const AliceFoo = alice.registerProtocol(Foo)
    const AliceBar = alice.registerProtocol(Bar)

    await alice.listen()

    const ping = new Promise((resolve) => {
      alice.on('connection', (conn) => {
        conn.on('data', (data) => {
          data = b4a.toString(data)
          if (data === 'ping') resolve(data)
        })
      })
    })

    // // ===

    const sdkB = await sdk()
    const bob = sdkB.slashtag({ name: 'bob' })

    const BobFoo = bob.registerProtocol(Foo)
    const BobBar = bob.registerProtocol(Bar)

    const foo = new Promise((resolve) => AliceFoo.on('message', resolve))
    const bar = new Promise((resolve) => AliceBar.on('message', resolve))

    const connection = bob.connect(alice.key)

    const interval = setInterval(async () => {
      (await connection).write(b4a.from('ping'))
    }, 10)

    BobFoo.request(alice.key)
    BobBar.request(alice.key)

    expect(await foo).to.eql('foo')
    expect(await bar).to.eql('bar')
    expect(await ping).to.eql('ping')

    sdkA.close()
    sdkB.close()
    clearInterval(interval)

    await new Promise((resolve) =>
      setTimeout(() => {
        resolve()
      }, 5)
    )
  })
})
