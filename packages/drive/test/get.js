import test from 'brittle'
import Corestore from 'corestore'
import b4a from 'b4a'
import Keychain from 'keypear'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

test('get - public drive', async (t) => {
  const drivestore = new Drivestore(new Corestore(tmpdir()), new Keychain())

  const publicA = drivestore.get('public')
  await publicA.ready()

  const publicB = drivestore.get()
  await publicB.ready()

  t.not(publicA, publicB, 'should return a session')
  t.alike(publicA.key, publicB.key, 'same public key')
  t.absent(publicA.core.encryptionKey, 'do not encrypt public drive')
  t.ok(publicA.core.writable)

  t.alike(publicA.discoveryKey, publicB.discoveryKey)

  const buf = b4a.from('bar')
  await publicA.put('foo', buf)
  const resolved = await publicB.get('foo')
  t.alike(resolved, buf)
})

test('get - private drive basic', async (t) => {
  const drivestore = new Drivestore(new Corestore(tmpdir()), new Keychain())

  const foo = drivestore.get('foo')
  const bar = drivestore.get('bar')

  await Promise.all([foo.ready(), bar.ready()])

  t.unlike(bar.key, foo.key)

  t.ok(foo.core.encryptionKey)
  t.ok(bar.core.encryptionKey)

  t.unlike(bar.core.encryptionKey, foo.core.encryptionKey)

  t.ok(foo.core.writable)
  t.ok(bar.core.writable)

  t.unlike(foo.blobs?.core.key, foo.key)
  t.unlike(bar.blobs?.core.key, foo.key)
})

test('get - public drive (readonly)', async (t) => {
  const keychain = new Keychain()
  const drivestore = new Drivestore(new Corestore(tmpdir()), keychain)

  const publicKey = keychain.get().publicKey

  const clone = new Drivestore(new Corestore(tmpdir()), publicKey)

  const publicDrive = drivestore.get()
  await publicDrive.ready()

  const clonedPublicDrive = clone.get()
  await clonedPublicDrive.ready()

  t.alike(publicDrive.key, clonedPublicDrive.key)
  t.absent(clonedPublicDrive.encryptionKey)
  t.absent(clonedPublicDrive.core.writable)
})
