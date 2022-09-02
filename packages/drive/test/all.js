import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import crypto from 'hypercore-crypto'
import path from 'path'
import os from 'os'

import Drivestore from '../index.js'

test('constructor', async (t) => {
  const keyPair = crypto.keyPair()
  const corestore = new Corestore(RAM)
  await corestore.ready()

  const drivestore = new Drivestore(corestore, keyPair)
  await drivestore.corestore.ready()

  t.alike(drivestore.corestore.primaryKey, keyPair.secretKey)
  t.unlike(drivestore.corestore.primaryKey, corestore.primaryKey)
})

test('get - public drive', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(RAM), keyPair)

  const publicA = drivestore.get('/public')
  const publicB = drivestore.get()

  await Promise.all([publicA.ready(), publicB.ready()])

  t.alike(publicA.key, publicB.key)
  t.alike(publicA.key, keyPair.publicKey)
  t.absent(publicA.core.encrytionKey)
  t.absent(publicB.core.encrytionKey)
})

test('get - private drive basic', async (t) => {
  const keyPair = crypto.keyPair()
  const drivestore = new Drivestore(new Corestore(RAM), keyPair)

  const foo = drivestore.get('/foo')
  const bar = drivestore.get('/bar')

  await Promise.all([foo.ready(), bar.ready()])

  t.unlike(foo.key, keyPair.key)
  t.unlike(bar.key, keyPair.key)
  t.unlike(bar.key, foo.key)

  t.ok(foo.core.encryptionKey)
  t.ok(bar.core.encryptionKey)

  t.unlike(bar.core.encryptionKey, foo.core.encryptionKey)

  await foo.getBlobs()
  await bar.getBlobs()

  t.alike(foo.core.encryptionKey, foo.blobs.core.encryptionKey)
  t.alike(bar.core.encryptionKey, bar.blobs.core.encryptionKey)
})

test('flush', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM), crypto.keyPair())

  drivestore.get('/foo')
  drivestore.get('/bar')

  const listBeforeFlush = []
  for await (const entry of drivestore) {
    listBeforeFlush.push(entry.path)
  }
  t.alike(listBeforeFlush, [])

  await drivestore.flush()

  const list = []
  for await (const entry of drivestore) {
    list.push(entry.path)
  }
  t.alike(list, ['/bar', '/foo', '/public'])
})

test('close', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  const drivestore = new Drivestore(corestore, crypto.keyPair())

  drivestore.get('/foo')
  drivestore.get('/bar')

  await drivestore.close()
  await corestore.close()

  const reopened = new Drivestore(new Corestore(dir), drivestore.keyPair)
  await reopened.ready()

  const list = []
  for await (const entry of reopened) {
    list.push(entry.path)
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

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}
