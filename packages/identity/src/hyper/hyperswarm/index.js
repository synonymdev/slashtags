// @ts-ignore
import Hyperswarm from 'hyperswarm'
import { DHT } from 'dht-universal'
import b4a from 'b4a'

/**
 *
 * @param {import('../../interfaces').Slashtags} slash
 * @param {import('../../interfaces').HyperswarmOptions} [options]
 */
export async function slashHyperSwarm (slash, options) {
  const dht = await DHT.create(options?.dhtOptions || {})
  const swarm = new Hyperswarm({ dht })
  slash.decorate('swarm', swarm)

  slash.onClose(async () => {
    await swarm.destroy()
  })

  slash.decorate('hyperswarmOnConnection', hyperswarmOnConnection)
  /** @type {import('../../interfaces').HyperswarmAPI['hyperswarmOnConnection']} */
  async function hyperswarmOnConnection (callback) {
    swarm.on('connection', callback)
  }

  const discovered = new Map()

  slash.decorate('hyperswarmJoin', hyperswarmJoin)
  /** @type {import('../../interfaces').HyperswarmAPI['hyperswarmJoin']} */
  async function hyperswarmJoin (discoveryKey, options) {
    if (!options?.announce && !options?.lookup) return

    const announce = options?.announce
    const lookup = options?.lookup

    // TODO: remove this if peer discovery does it by default
    // Avoid unnecessary discovery that needs to be flushed
    const keyHex = b4a.toString(discoveryKey, 'hex')
    if (discovered.has(keyHex)) {
      const discovery = discovered.get(keyHex)
      if (
        !(
          announce !== undefined &&
          announce !== discovery.announce &&
          lookup !== undefined &&
          lookup !== discovery.lookup
        )
      ) { return }
    } else {
      discovered.set(keyHex, { announce, lookup })
    }

    const discovery = swarm.join(discoveryKey, {
      ...options,
      server: announce,
      client: lookup
    })

    await discovery.flushed()
  }
}
