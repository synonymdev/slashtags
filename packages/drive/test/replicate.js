const test = require('brittle')
const Corestore = require('corestore')
const RAM = require('random-access-memory')
const crypto = require('hypercore-crypto')
const b4a = require('b4a')

const Drivestore = require('../index.js')

test('replicate', async (t) => {
  const corestore = new Corestore(RAM)
  const drivestore = new Drivestore(corestore, crypto.keyPair())
  const remote = new Corestore(RAM)

  const s1 = remote.replicate(true)
  s1.pipe(drivestore.replicate(false)).pipe(s1)

  {
    const drive = drivestore.get('private')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    clone.findingPeers()
    await clone.update()
    t.is(clone.length, 2)
  }

  {
    const drive = drivestore.get('public')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    clone.findingPeers()
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
    clone.findingPeers()
    await clone.update()
    t.is(clone.length, 2)
  }

  {
    const drive = drivestore.get('public')
    await drive.put('/foo', b4a.from('bar'))

    const clone = remote.get({ key: drive.key })
    clone.findingPeers()
    await clone.update()
    t.is(clone.length, 2)
  }
})

test('get - validate drive name', (t) => {
  const drivestore = new Drivestore(new Corestore(RAM), crypto.keyPair())
  t.exception(() => drivestore.get('foo:'), /Invalid drive name/)
})
