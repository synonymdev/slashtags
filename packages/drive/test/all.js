import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import crypto from 'hypercore-crypto'
import path from 'path'
import os from 'os'
import b4a from 'b4a'

import Drivestore from '../index.js'

test('constructor', async (t) => {
  const keyPair = crypto.keyPair()
  const corestore = new Corestore(RAM)
  await corestore.ready()

  const drivestore = new Drivestore(corestore, keyPair)
  await drivestore.ready()

  t.alike(drivestore.corestore.primaryKey, keyPair.secretKey)
  t.unlike(drivestore.corestore.primaryKey, corestore.primaryKey)
  t.ok(drivestore._metadata.feed.encryptionKey)
})

test('get - public drive', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(RAM), keyPair)

  const publicA = drivestore.get('/public')
  const publicB = drivestore.get()

  await Promise.all([publicA.ready(), publicB.ready()])

  t.not(publicA, publicB, 'should return a session')
  t.alike(publicA.key, publicB.key)
  t.alike(publicA.key, keyPair.publicKey)
  t.absent(publicA.core.encryptionKey)
  t.absent(publicB.core.encryptionKey)
  t.ok(publicA.core.writable)
  await publicA.getBlobs()
  t.ok(publicA.blobs?.core.writable)

  const buf = b4a.from('bar')
  await publicA.put('/foo', buf)
  t.alike(await publicA.get('/foo'), buf)
})

test('get - private drive basic', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(RAM), keyPair)

  const foo = drivestore.get('/foo')
  const bar = drivestore.get('/bar')

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
})

test('save metadata on ready', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM), crypto.keyPair())

  const pub = drivestore.get('/public')
  const foo = drivestore.get('/foo')
  const bar = drivestore.get('/bar')

  const listBeforeFlush = []
  for await (const entry of drivestore) {
    listBeforeFlush.push(entry?.path)
  }
  t.alike(listBeforeFlush, [])

  await Promise.all([pub.ready(), foo.ready(), bar.ready()])

  const list = []
  for await (const entry of drivestore) {
    list.push(entry?.path)
  }
  t.alike(list, ['/bar', '/foo', '/public'])
})

test('reopen', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  const drivestore = new Drivestore(corestore, crypto.keyPair())

  await drivestore.get().ready()
  await drivestore.get('/foo').ready()
  await drivestore.get('/bar').ready()

  await corestore.close()

  const reopened = new Drivestore(new Corestore(dir), drivestore.keyPair)
  await reopened.ready()

  const list = []
  for await (const entry of reopened) {
    list.push(entry?.path)
  }
  t.alike(list, ['/bar', '/foo', '/public'], 'reopend metadata from storage')
})

test('replicate', async (t) => {
  const corestore = new Corestore(RAM)
  const drivestore = new Drivestore(corestore, crypto.keyPair())

  const s1 = corestore.replicate(true)
  const s2 = drivestore.replicate(s1)

  t.is(s2, s1)
})

test('multiple drivestores', async (t) => {
  const ns = new Corestore(RAM)
  await ns.ready()

  const a = new Drivestore(ns, crypto.keyPair())
  await a.ready()
  const b = new Drivestore(ns, crypto.keyPair())
  await b.ready()

  t.alike(a.corestore._namespace, b4a.alloc(32))
  t.alike(b.corestore._namespace, b4a.alloc(32))
  t.ok(a.corestore.primaryKey)
  t.unlike(a.corestore.primaryKey, b.corestore.primaryKey)
  t.unlike(a._metadata.feed.key, b._metadata.feed.key)

  t.pass('does not close corestore in drivestore')
})

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}
