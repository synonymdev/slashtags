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
    key: b4a.from('970986d925c7b587172c773f91e9e667bfe572fd8df63235f4ab5f38e0b2100b', 'hex'),
    encryptionKey: b4a.from('659171dcc8ae7e67c3350bc9354abc8f2b0587116af0c36f2af8b7b8decdcd02', 'hex')
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
