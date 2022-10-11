import test from 'brittle'
import RAM from 'random-access-memory'
import fs from 'fs'
import path from 'path'
import b4a from 'b4a'

import SDK from '../index.js'
import { tmpdir } from './helpers/index.js'

test('close - close all opened resources', async t => {
  const sdk = new SDK({ storage: RAM })

  const alice = sdk.slashtag('alice')
  const bob = sdk.slashtag('bob')

  await sdk.close()

  t.ok(alice.closed)
  t.ok(bob.closed)
  t.ok(sdk.swarm.destroyed)
  t.ok(sdk.corestore._root._closing)
})

test('not store primary key in rest', async t => {
  const dir = tmpdir()
  const sdk = new SDK({ storage: dir })

  await sdk.ready()

  const stored = fs.readFileSync(path.join(dir, 'primary-key'))

  t.unlike(stored, sdk.primaryKey)

  await sdk.close()
})

test('closed - corestore is closing', async (t) => {
  const dir = tmpdir()
  const key = b4a.from('a'.repeat(64), 'hex')
  const sdk = new SDK({ storage: dir })

  // Opened should not throw
  const writableOpened = sdk.slashtag().drivestore.get()
  await writableOpened.ready()

  const readableOpened = sdk.drive(key)
  await readableOpened.ready()

  // Inflight should not throw
  const writableInflight = sdk.slashtag().drivestore.get()
  const readbleInflight = sdk.drive(key)

  await sdk.close()

  t.ok(sdk.closed)

  writableInflight.ready()
  readbleInflight.ready()

  t.pass('catch ready is enouhg to catch inflight errors')

  t.exception(() => sdk.slashtag('foo'), /SDK is closed/)
  t.exception(() => sdk.drive(key), /SDK is closed/)

  if (!sdk.closed) {
    sdk.slashtag()
    sdk.drive(key)
  }

  t.pass('checking sdk.closed is enought to avoid sync errors')

  await sdk.close()
})
