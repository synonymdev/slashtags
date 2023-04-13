const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const { relay } = require('@hyperswarm/dht-relay')
const Stream = require('@hyperswarm/dht-relay/ws')
const { WebSocketServer } = require('ws')
const RAM = require('random-access-memory')
const b4a = require('b4a')

const SDK = require('../index.js')

test('basic', async t => {
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

test('read and write to drives despite failing relay', async (t) => {
  // @ts-ignore
  const address = 'ws://localhost:9999'
  const sdk = new SDK({ storage: RAM, relay: address })

  await t.exception(() => sdk.ready())
  sdk.ready().catch(noop)
  t.pass('catch handles disconnection')

  const writable = sdk.slashtag().drivestore.get()

  const buf = b4a.from('hello world')
  await writable.put('/foo', buf)

  const readable = sdk.drive(writable.key)
  t.alike(await readable.get('/foo'), buf)

  await sdk.close()
})

function noop () { }
