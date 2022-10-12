import test from 'brittle'
import Corestore from 'corestore'
import crypto from 'hypercore-crypto'
import RAM from 'random-access-memory'
import Keychain from 'keypear'
import b4a from 'b4a'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

test('metadata DB keys', async (t) => {
  const keyPair = crypto.keyPair(b4a.alloc(32).fill('a'))
  const drivestore = new Drivestore(new Corestore(RAM), new Keychain(keyPair))
  await drivestore.ready()

  const expected = {
    key: b4a.from('ca3dea87068c147131ab6e3ff8e36b5b7ce329328a30422c8732bbe683288044', 'hex'),
    encryptionKey: b4a.from('789dee95ba8b475b4d95baf7807c4bd540474412359aa745dc582e0c1478670e', 'hex')
  }
  t.alike(drivestore._metadata?.feed.key, expected.key)
  t.alike(drivestore._metadata?.feed.encryptionKey, expected.encryptionKey)
})

test('unique private drives for unique keychains', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  await corestore.ready()

  const ds1 = new Drivestore(corestore)
  await ds1.ready()
  const ds1Public = ds1.get()
  const ds1Private = ds1.get('contacts')

  const ds2 = new Drivestore(corestore)
  await ds2.ready()
  const ds2Public = ds2.get('contacts')
  const ds2Private = ds2.get('contacts')

  await Promise.all([ds1Public, ds2Public, ds1Private, ds2Private].map(d => d.ready()))

  t.unlike(ds1.key, ds2.key)

  t.ok(ds1Public.key)
  t.unlike(ds2Public.key, ds1Public.key)

  t.ok(ds1Private.key)
  t.unlike(ds2Private.key, ds1Private.key)
})

test('pirvatechain should not be possible to guess', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM))
  await drivestore.ready()

  const privateTweak = drivestore.privatechain?.tweak
  t.ok(privateTweak)
  // In the off chance we need to expose the root private tweak!
  t.unlike(privateTweak, drivestore.signer)
  t.unlike(privateTweak?.scalar, drivestore.signer.scalar)

  const readonly = new Drivestore(new Corestore(RAM), drivestore.key)

  const guessed = readonly.keychain.sub(readonly.signer.publicKey).tweak
  t.unlike(guessed, privateTweak)
  t.unlike(guessed.scalar, privateTweak?.scalar)
  t.unlike(guessed.publicKey, privateTweak?.publicKey)
})

test('prove ownership of private drive by exposing tweak', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM))
  await drivestore.ready()

  const foo = drivestore.get('foo')
  await foo.ready()

  const fooKeychain = drivestore.driveschain?.sub('foo')
  t.alike(fooKeychain?.head.publicKey, foo.key)

  const readonly = new Drivestore(new Corestore(RAM), drivestore.key)
  t.exception(() => readonly.get('foo'), /Can not derive private drives in readonly drivestore/)

  const withTweak = new Keychain(readonly.keychain.home, null, fooKeychain?.tweak)
  t.alike(withTweak.head.publicKey, foo.key)
})
