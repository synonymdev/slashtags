import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'

import Drivestore from '../index.js'

test('replicate', async (t) => {
  const corestore = new Corestore(RAM)
  const drivestore = new Drivestore(corestore, crypto.keyPair())
  const remote = new Corestore(RAM)

  const s3 = remote.replicate(true)
  s3.pipe(drivestore.replicate(false)).pipe(s3)

  {
    const drive = drivestore.get('private')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    await clone.update()
    t.is(clone.length, 2)
  }

  {
    const drive = drivestore.get('public')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    await clone.update()
    t.is(clone.length, 2)
  }
})

test('replicate through passed corestore', async (t) => {
  const corestore = new Corestore(RAM)
  const drivestore = new Drivestore(corestore, crypto.keyPair())
  const remote = new Corestore(RAM)

  const s3 = remote.replicate(true)
  s3.pipe(corestore.replicate(false)).pipe(s3)

  {
    const drive = drivestore.get('private')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    await clone.update()
    t.is(clone.length, 2)
  }

  {
    const drive = drivestore.get('public')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    await clone.update()
    t.is(clone.length, 2)
  }
})

test('get - validate drive name', (t) => {
  const drivestore = new Drivestore(new Corestore(RAM), crypto.keyPair())
  t.exception(() => drivestore.get('foo:'), /Invalid drive name/)
})
