import createTestnet from '@hyperswarm/testnet'
import test from 'brittle'
import { homedir } from 'os'
import RAM from 'random-access-memory'
import { relay } from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import { WebSocketServer } from 'ws'

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

test('relay', async t => {
  const testnet = await createTestnet(3, t.teardown)

  const server = new WebSocketServer({ port: 0 })
  server.on('connection', socket => {
    relay(testnet.nodes[0], new Stream(false, socket))
  })

  // @ts-ignore
  const address = 'ws://localhost:' + server.address().port
  const sdkA = new SDK({ storage: RAM, relay: address })
  const alice = sdkA.slashtag()

  const sdkB = new SDK({ storage: RAM, relay: address })
  const bob = sdkB.slashtag()

  const st = t.test('server')
  st.plan(1)

  await bob.listen()
  bob.on('connection', socket => {
    st.alike(socket.remotePublicKey, alice.key)
  })

  alice.connect(bob.id)

  await st

  await sdkA.close()
  await sdkB.close()
  server.close()

  t.pass('closed')
})
