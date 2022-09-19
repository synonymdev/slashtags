import createTestnet from '@hyperswarm/testnet'
import test from 'brittle'
import { homedir } from 'os'
import RAM from 'random-access-memory'

import SDK from '../index.js'

test('empty options', t => {
  const sdk = new SDK()

  t.is(
    sdk.storage,
    homedir() + '/.slashtags',
    'By default save at {homedir()}/.slashtags'
  )

  sdk.close()
})

test('custom storage', async t => {
  let usedCustom = false

  const sdk = new SDK({
    storage: () => {
      usedCustom = true
      return new RAM()
    }
  })

  const core = sdk.corestore.get({ name: 'foo' })
  await core.append(['bar'])
  t.ok(usedCustom)

  await sdk.close()
})

test('bootstrap', async t => {
  const testnet = await createTestnet(3, t.teardown)
  const sdk = new SDK({ ...testnet, storage: RAM })

  t.alike(sdk.swarm.dht.bootstrapNodes, testnet.bootstrap)

  await sdk.close()
})
