import test from 'brittle'
import Corestore from 'corestore'
import crypto from 'hypercore-crypto'
import path from 'path'
import fs from 'fs'

import Drivestore from '../index.js'
import { tmpdir } from './helpers/index.js'

test('dont store secretKey at rest', async (t) => {
  const dir = tmpdir()
  const corestore = new Corestore(dir)
  await corestore.ready()

  const drivestore = new Drivestore(corestore, crypto.keyPair())
  await drivestore.ready()

  t.ok(drivestore.corestore.primaryKey)

  await corestore.close()
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
  const ds1Public = ds1.get()
  const ds1Private = ds1.get('contacts')

  const kp2 = crypto.keyPair()
  const ds2 = new Drivestore(corestore, kp2)
  await ds2.ready()
  const ds2Public = ds2.get('contacts')
  const ds2Private = ds2.get('contacts')

  await Promise.all([ds1Public, ds2Public, ds1Private, ds2Private].map(d => d.ready()))

  t.unlike(ds1.keyPair.secretKey, ds2.keyPair.secretKey)

  t.ok(ds1Public.key)
  t.unlike(ds2Public.key, ds1Public.key)

  t.ok(ds1Private.key)
  t.unlike(ds2Private.key, ds1Private.key)
})
