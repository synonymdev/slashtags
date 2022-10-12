import test from 'brittle'
import Corestore from 'corestore'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

test('get - public drive', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(tmpdir()), keyPair)

  const publicA = drivestore.get('public')
  await publicA.ready()
  t.alike(publicA.key, keyPair.publicKey)

  const publicB = drivestore.get()
  await publicB.ready()
  t.alike(publicB.key, keyPair.publicKey)

  t.not(publicA, publicB, 'should return a session')
  t.alike(publicA.key, publicB.key, 'same public key')
  t.absent(publicA.core.encryptionKey, 'do not encrypet public drive')
  t.absent(publicB.core.encryptionKey, 'do not encrypet public drive')
  t.ok(publicA.core.writable)
  await publicA.getBlobs()
  t.ok(publicA.blobs?.core.writable)
  t.unlike(publicA.blobs?.core.key, publicA.key)
  t.unlike(publicB.blobs?.core.key, publicB.key)
  t.absent(publicA.blobs?.core.encryptionKey, 'do not encrypet public drive')
  t.absent(publicB.blobs?.core.encryptionKey, 'do not encrypet public drive')

  t.ok(publicA.discoveryKey)
  t.alike(publicA.discoveryKey, publicB.discoveryKey)

  const buf = b4a.from('bar')
  await publicA.put('foo', buf)
  t.alike(await publicA.get('foo'), buf)
})

test('get - private drive basic', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(tmpdir()), keyPair)

  const foo = drivestore.get('foo')
  const bar = drivestore.get('bar')

  await Promise.all([foo.ready(), bar.ready()])

  t.unlike(foo.key, keyPair.publicKey)
  t.unlike(bar.key, keyPair.publicKey)
  t.unlike(bar.key, foo.key)

  t.ok(foo.core.encryptionKey)
  t.ok(bar.core.encryptionKey)

  t.unlike(bar.core.encryptionKey, foo.core.encryptionKey)

  await foo.getBlobs()
  await bar.getBlobs()

  t.alike(foo.core.encryptionKey, foo.blobs?.core.encryptionKey)
  t.alike(bar.core.encryptionKey, bar.blobs?.core.encryptionKey)

  t.ok(foo.core.writable)
  await foo.getBlobs()
  t.ok(foo.blobs?.core.writable)
  t.unlike(foo.blobs?.core.key, foo.key)
  t.unlike(bar.blobs?.core.key, foo.key)
})
