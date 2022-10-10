import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import b4a from 'b4a'
import Keychain from 'keypear'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

test('constructor - readonly', async (t) => {
  const readonly = new Drivestore(new Corestore(RAM), b4a.alloc(32))
  // get public drive to ensure it does not throw attempting saving metadata
  readonly.get()
  await readonly.ready()

  t.absent(readonly.writable)
})

test('save metadata on flush', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM))

  drivestore.get('foo')
  drivestore.get('bar')

  const listBeforeFlush = []
  for await (const entry of drivestore) {
    listBeforeFlush.push(entry?.name)
  }
  t.alike(listBeforeFlush, [])

  await drivestore.flush()

  const list = []
  for await (const entry of drivestore) {
    list.push(entry?.name)
  }
  t.alike(list, ['bar', 'foo'])
})

test('reopen', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)

  const keychain = new Keychain()
  const drivestore = new Drivestore(corestore, keychain)

  await drivestore.get().ready()
  await drivestore.get('foo').ready()
  await drivestore.get('bar').ready()

  await drivestore.flush()
  await corestore.close()
  t.ok(drivestore.closed, 'drivestore.closed true after corestore is closing')

  const reopened = new Drivestore(new Corestore(dir), keychain)
  await reopened.ready()

  const list = []
  for await (const entry of reopened) {
    list.push(entry?.name)
  }
  t.alike(list, ['bar', 'foo', 'public'], 'reopend metadata from storage')
})

test('multiple drivestores', async (t) => {
  const corestore = new Corestore(RAM)
  await corestore.ready()

  const a = new Drivestore(corestore)
  await a.ready()
  const b = new Drivestore(corestore)
  await b.ready()

  const pubA = a.get()
  await pubA.ready()
  const privA = a.get('foo')
  await privA.ready()

  const pubB = b.get()
  await pubB.ready()
  const privB = b.get('foo')
  await privB.ready()

  t.unlike(pubA.key, pubB.key)
  t.unlike(privA.key, privB.key)
  t.unlike(a._metadata?.feed.key, b._metadata?.feed.key)
})
