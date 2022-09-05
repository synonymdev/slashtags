import test from 'brittle'
import path from 'path'
import os from 'os'
import createTestnet from '@hyperswarm/testnet'
import fs from 'fs'
import RAM from 'random-access-memory'

import SDK from '../index.js'

test('open - do NOT store primaryKey', async (t) => {
  const testnet = await createTestnet(3, t.teardown)
  const dir = tmpdir()

  const sdk = new SDK({ ...testnet, storage: dir })
  await sdk.ready()

  const core = sdk.corestore.get({ name: 'foo' })
  await core.ready()

  t.ok(sdk.corestore.primaryKey)

  const items = fs.readdirSync(dir)
  t.absent(items.includes('primaryKey'))

  await sdk.close()
})

test('close - close all opened resources', async t => {
  const sdk = new SDK({ storage: RAM })

  const alice = sdk.slashtag('alice')
  const bob = sdk.slashtag('bob')

  await alice.drivestore.close()

  await sdk.close()

  t.ok(alice.closed)
  t.ok(bob.closed)
  t.ok(sdk.swarm.destroyed)
})

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}
