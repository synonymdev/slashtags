import Hyperswarm from 'hyperswarm'
import debug from 'debug'
import { DHT } from 'dht-universal'

const { RELAY_URL } = process.env

const logger = debug('slashtags:testing')

export function replicate (a, b) {
  if (process.title !== 'node') return relpicateThroughHyperswarm(a, b)

  const s1 = a.replicate(true)
  const s2 = b.replicate(false)

  log(s1, s2)

  s1.pipe(s2).pipe(s1)

  return { s1, s2, destroy () {} }
}

async function relpicateThroughHyperswarm (a, b) {
  // Replicating Corestore in the browser is more reliable through Hyperswarm connection
  const dht = await DHT.create({ relays: [RELAY_URL] })
  const swarmA = new Hyperswarm({ dht })
  const s1 = new Promise((resolve) =>
    swarmA.on('connection', (conn) => resolve(conn))
  )
  await swarmA.listen()

  const swarmB = new Hyperswarm({ dht })
  const s2 = await swarmB.dht.connect(swarmA.keyPair.publicKey)

  a.replicate(await s1)
  b.replicate(s2)

  log(await s1, s2)

  return {
    s1: await s1,
    s2,
    async destroy () {
      await swarmA.destroy()
      await swarmB.destroy()
    }
  }
}

function log (s1, s2) {
  s1.on('error', (err) => logger('S1 error: ', err))
  s2.on('error', (err) => logger('S2 error: ', err))
  // s1.on('data', (data) => logger('S1 data: ', b4a.toString(data, 'hex')));
  // s2.on('data', (data) => logger('S2 data: ', b4a.toString(data, 'hex')));
}
