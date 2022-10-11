import test from 'brittle'
import Corestore from 'corestore'
import RAM from 'random-access-memory'
import b4a from 'b4a'

import Drivestore from '../index.js'

test('replicate - public', async (t) => {
  const drivestore = new Drivestore(new Corestore(RAM))
  const clone = new Drivestore(new Corestore(RAM), drivestore.key)

  const s1 = clone.replicate(true)
  s1.pipe(drivestore.replicate(false)).pipe(s1)

  const buf = b4a.from('bar')
  await drivestore.get().put('/foo', buf)
  t.alike(await clone.get().get('/foo'), buf)
})

test('replicate - private', async (t) => {
  const corestore = new Corestore(RAM)
  const drivestore = new Drivestore(corestore)
  const remote = new Corestore(RAM)

  const s1 = remote.replicate(true)
  s1.pipe(drivestore.replicate(false)).pipe(s1)

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
  const drivestore = new Drivestore(corestore)
  const remote = new Corestore(RAM)

  const s1 = remote.replicate(true)
  s1.pipe(corestore.replicate(false)).pipe(s1)

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
  const drivestore = new Drivestore(new Corestore(RAM))
  t.exception(() => drivestore.get('foo:'), /Invalid drive name/)
})
