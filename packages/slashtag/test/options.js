import test from 'brittle'
import { Slashtag } from '../index.js'

test('initiatlize - empty options', async t => {
  const alice = new Slashtag()
  t.pass()
  await alice.close()
})

test('initialize - keyPair', async t => {
  const alice = new Slashtag()

  const other = new Slashtag({ keyPair: alice.keyPair })

  t.alike(other.keyPair, alice.keyPair)

  const drive = other.drivestore.get()
  await drive.ready()
  t.alike(drive.key, alice.key)

  await alice.close()
  await other.close()
})

test('initialize - corestore', async t => {
  const alice = new Slashtag()
  const other = new Slashtag({ corestore: alice.drivestore.corestore.namespace('foo'), keyPair: alice.keyPair })

  const a = alice.drivestore.get()
  const b = other.drivestore.get()
  await Promise.all([a.ready(), b.ready()])

  t.alike(a.key, b.key)

  await alice.close()
  await other.close()
})
