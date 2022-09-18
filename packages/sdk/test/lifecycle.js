import test from 'brittle'
import path from 'path'
import os from 'os'
import fs from 'fs'
import RAM from 'random-access-memory'

import SDK from '../index.js'

test('close - close all opened resources', async t => {
  const sdk = new SDK({ storage: RAM })

  const alice = sdk.slashtag('alice')
  const bob = sdk.slashtag('bob')

  await sdk.close()

  t.ok(alice.closed)
  t.ok(bob.closed)
  t.ok(sdk.swarm.destroyed)
})

test('not store primary key in rest', async t => {
  const dir = tmpdir()
  const sdk = new SDK({ storage: dir })

  await sdk.ready()

  const stored = fs.readFileSync(path.join(dir, 'primary-key'))

  t.unlike(stored, sdk.primaryKey)

  await sdk.close()
})

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}
