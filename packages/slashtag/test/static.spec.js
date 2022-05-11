import { expect } from 'aegir/chai'
import b4a from 'b4a'

import { createKeyPair } from '../src/crypto.js'
import { Slashtag } from '../src/index.js'

describe('static createKeyPair()', () => {
  it('should create random keypair', () => {
    const keyPair = Slashtag.createKeyPair()
    const keyPair2 = Slashtag.createKeyPair()

    expect(keyPair.publicKey).to.not.eql(keyPair2.publicKey)
  })

  it('should return the same result as crypto.createKeyPair', () => {
    const primaryKey = b4a.from('a'.repeat(32), 'hex')
    expect(Slashtag.createKeyPair(primaryKey).publicKey).to.eql(
      createKeyPair(primaryKey).publicKey
    )
    expect(Slashtag.createKeyPair(primaryKey, 'foo').publicKey).to.eql(
      createKeyPair(primaryKey, 'foo').publicKey
    )
    expect(
      Slashtag.createKeyPair(primaryKey, 'foo').auth.sign(b4a.from('foo'))
    ).to.eql(createKeyPair(primaryKey, 'foo').auth.sign(b4a.from('foo')))
  })
})

describe('initialize', () => {
  it('should throw an error for missing parameters', async () => {
    expect(() => new Slashtag({})).to.throw('Missing keyPair, key, or url')
  })

  it('should set slashtag url', () => {
    const keyPair = Slashtag.createKeyPair()

    const alice = new Slashtag({
      keyPair
    })

    expect(alice.key).to.eql(keyPair.publicKey)
    expect(alice.url.toString()).to.be.startWith('slash://')
  })

  it('should be able to create a slasthag from a url', async () => {
    const keyPair = Slashtag.createKeyPair()

    const alice = new Slashtag({ keyPair })

    const aliceRemote = new Slashtag({ url: alice.url.toString() })

    expect(aliceRemote.remote).to.be.true()
    expect(aliceRemote.key).to.eql(alice.key)
    expect(aliceRemote.url.toString()).to.be.startWith('slash://')

    await alice.close()
    await aliceRemote.close()
  })
})
