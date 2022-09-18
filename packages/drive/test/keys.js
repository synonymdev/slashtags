import test from 'brittle'
import Corestore from 'corestore'
import crypto from 'hypercore-crypto'
import path from 'path'
import os from 'os'
import fs from 'fs'

import Drivestore from '../index.js'

test('dont store secretKey at rest', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  await corestore.ready()

  const drivestore = new Drivestore(corestore, crypto.keyPair())
  await drivestore.ready()

  t.ok(drivestore.corestore.primaryKey)

  const stored = fs.readFileSync(path.join(dir, 'primary-key'))
  
  t.unlike(stored, drivestore.corestore.primaryKey)
})

test('unique private drives for unique keyPairs', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  await corestore.ready()

  const kp1 = crypto.keyPair()
  const ds1 = new Drivestore(corestore, kp1)
  await ds1.ready()
  const ds1_public = ds1.get()
  const ds1_private = ds1.get('contacts')

  const kp2 = crypto.keyPair()
  const ds2 = new Drivestore(corestore, kp2)
  await ds2.ready()
  const ds2_public = ds2.get()
  const ds2_private = ds2.get('contacts')

  await Promise.all([ds1_public, ds2_public, ds1_private, ds2_private].map(d => d.ready()))

  t.ok(ds1.corestore.primaryKey)
  t.alike(ds1.corestore.primaryKey, ds1.keyPair.secretKey)

  t.ok(ds2.keyPair.secretKey)
  t.alike(ds2.corestore.primaryKey, ds2.keyPair.secretKey)

  t.unlike(ds1.keyPair.secretKey, ds2.keyPair.secretKey)

  t.ok(ds1_public.key)
  t.unlike(ds2_public.key, ds1_public.key)

  t.ok(ds1_private.key)
  t.unlike(ds2_private.key, ds1_private.key)
})

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}

