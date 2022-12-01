import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

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

test('save metadata on ready', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM), crypto.keyPair())

  const foo = drivestore.get('foo')
  const bar = drivestore.get('bar')

  const listBeforeFlush = []
  for await (const entry of drivestore) {
    listBeforeFlush.push(entry?.name)
  }
  t.alike(listBeforeFlush, [])

  await Promise.all([foo.ready(), bar.ready()])

  await new Promise(resolve => setImmediate(resolve))

  const list = []
  for await (const entry of drivestore) {
    list.push(entry?.name)
  }
  t.alike(list, ['bar', 'foo'])
})

test('reopen', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  const drivestore = new Drivestore(corestore, crypto.keyPair())

  await drivestore.get().ready()
  await drivestore.get('foo').ready()
  await drivestore.get('bar').ready()
  await new Promise(resolve => setTimeout(resolve, 10))

  await corestore.close()
  t.ok(drivestore.closed, 'drivestore.closed true after corestore is closing')

  const reopened = new Drivestore(new Corestore(dir), drivestore.keyPair)
  await reopened.ready()

  const list = []
  for await (const entry of reopened) {
    list.push(entry?.name)
  }
  t.alike(list, ['bar', 'foo'], 'reopend metadata from storage')
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

test('open on closing corestore', async (t) => {
  const corestore = new Corestore(RAM)
  const drive = new Drivestore(corestore, crypto.keyPair())
  corestore.close()
  t.pass(await drive.ready())
})
