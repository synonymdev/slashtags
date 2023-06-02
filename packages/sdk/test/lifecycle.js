const test = require('brittle')
const RAM = require('random-access-memory')
const fs = require('fs')
const path = require('path')
const b4a = require('b4a')

const SDK = require('../index.js')
const { tmpdir } = require('./helpers/index.js')

test('open - use the same hyperswarm keypair', async (t) => {
  const sdk = new SDK({ primaryKey: b4a.alloc(32), storage: RAM })

  t.is(
    b4a.toString(sdk.swarm.keyPair.publicKey, 'hex'),
    '5a769551c9485b330d47ca2361e5760763c5c7349f3d5b1bacb0bdc403b9e14b'
  )
  await sdk.close()
})

test('close - close all opened resources', async t => {
  const sdk = new SDK({ storage: RAM })

  const alice = sdk.slashtag('alice')
  const bob = sdk.slashtag('bob')

  await sdk.close()

  t.ok(alice.closed)
  t.ok(bob.closed)
  t.ok(sdk.swarm.destroyed)
  t.ok(sdk.corestore.closing)
})

test('not store primary key in rest', async t => {
  const dir = tmpdir()
  const sdk = new SDK({ storage: dir })

  await sdk.ready()

  await sdk.corestore.close()
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

  await sdk.close()

  t.ok(sdk.closed)

  t.exception(() => sdk.slashtag('foo'), /SDK is closed/)
  t.exception(() => sdk.drive(key), /SDK is closed/)

  if (!sdk.closed) {
    sdk.slashtag()
    sdk.drive(key)
  }

  t.pass('checking sdk.closed is enought to avoid sync errors')

  await sdk.close()
})
