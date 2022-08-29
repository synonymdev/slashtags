import test from 'brittle'
import { Slashtag } from '../index.js'

test('initiatlize - empty options', async t => {
  const alice = new Slashtag()
  t.pass()
  alice.close()
})

test('initialize - keyPair', async t => {
  const alice = new Slashtag()
  t.pass()

  const other = new Slashtag({ keyPair: alice.keyPair })

  t.alike(other.keyPair, alice.keyPair)

  alice.close()
  other.close()
})
