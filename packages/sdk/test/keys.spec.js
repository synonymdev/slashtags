import { expect } from 'aegir/utils/chai.js'
import { KeyManager, generatePrimaryKey } from '../src/keys.js'
import RAM from 'random-access-memory'
import Corestore from 'corestore'
import b4a from 'b4a'

describe('keys', () => {
  it("replicate the same behavior as the Corestore's KeyManager", async () => {
    const storeA = new Corestore(RAM)
    const coreA = await storeA.get({ name: 'foo' })
    await coreA.ready()

    const customKeys = new KeyManager(storeA.keys.profile)
    // @ts-ignore
    customKeys._prefix = b4a.from('@hyperspace/key-manager')
    customKeys._namespace = storeA._namespace

    const storeB = new Corestore(RAM)
    const coreB = await storeB.get({
      keyPair: customKeys.generateKeyPair('foo')
    })
    await coreB.ready()

    expect(coreB.keyPair).to.eql(coreA.keyPair)
    expect(coreB.keyPair).to.eql(null)

    expect(coreB.auth.sign(b4a.from('hello'))).to.eql(
      coreA.auth.sign(b4a.from('hello')),
      'should return the same signature'
    )
  })

  it('should create keypairs', async () => {
    const keys = new KeyManager()
    const kp1 = await keys.generateKeyPair('core1')
    const kp2 = await keys.generateKeyPair('core2')
    expect(kp1.publicKey.length).to.equal(32)
    expect(kp2.publicKey.length).to.equal(32)
    expect(kp1.publicKey).to.not.eql(kp2.publicKey)
  })

  it('distinct namespaces create distinct keypairs', async () => {
    const keys = new KeyManager()
    const keysA = keys.namespace('Alice')
    const keysB = keys.namespace('Bob')
    expect(keysA._namespace).to.not.eql(keys._namespace)
    expect(keysB._namespace).to.not.eql(keys._namespace)
    expect(keysA._namespace).to.not.eql(keysB._namespace)
    const kp1 = keysA.generateKeyPair('core1')
    const kp2 = keysB.generateKeyPair('core1')
    expect(kp1.publicKey).to.not.eql(kp2.publicKey)
  })

  it('short user-provided profile will throw', async () => {
    const profile = Buffer.from('hello')
    const keys = new KeyManager(profile)
    expect(() => keys.generateKeyPair('core1')).to.throw()
  })

  it('different master keys -> different keys', async () => {
    const keysA = new KeyManager()
    const keysB = new KeyManager()
    const kp1 = keysA.generateKeyPair('core1')
    const kp2 = keysB.generateKeyPair('core1')
    expect(kp1.publicKey).to.not.eql(kp2.publicKey)
  })

  it('should generates the same keyPairs deterministically from the same profile and path', () => {
    const primaryKey = generatePrimaryKey()

    const rootsA = new KeyManager(primaryKey)
    const aliceA = rootsA.namespace('Alice')
    const bobA = aliceA.namespace('Bob')
    const keyPairA = bobA.generateKeyPair('core1')
    const publicKeyA = keyPairA.publicKey

    const rootsB = new KeyManager(primaryKey)
    const aliceB = rootsB.namespace('Alice')
    const bobB = aliceB.namespace('Bob')
    const keyPairB = bobB.generateKeyPair('core1')
    const publicKeyB = keyPairB.publicKey

    expect(publicKeyB).to.eql(publicKeyA)
  })
})
