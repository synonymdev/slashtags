// @ts-ignore
import Hyperswarm from 'hyperswarm'
import { DHT } from 'dht-universal'
import b4a from 'b4a'

export const events = {
  ON_CONNECTION: 'HYPERSWARM_ON_CONNECTION',
  JOIN: 'HYPERSWARM_JOIN'
}

/**
 *
 * @param {import('../../interfaces').Slashtags} slash
 * @param {import('../../interfaces').HyperswarmOptions} [options]
 */
export async function slashHyperSwarm (slash, options) {
  // Setup
  const dht = await DHT.create(options?.dhtOptions || {})
  const swarm = new Hyperswarm({ dht })

  slash.onClose(async () => await swarm.destroy())

  // API extension
  slash.decorate('hyperswarmOnConnection', hyperswarmOnConnection)
  slash.decorate('hyperswarmJoin', hyperswarmJoin)

  // Event Listeners
  slash.on(events.ON_CONNECTION, hyperswarmOnConnection)
  slash.on(events.JOIN, hyperswarmJoin)

  // API Implementation

  /** @type {HyperswarmAPI['hyperswarmOnConnection']} */
  async function hyperswarmOnConnection (callback) {
    swarm.on('connection', callback)
  }

  const discovered = new Map()

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
      ) {
        return
      }
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

/** @typedef {import('../../interfaces').Slashtags} Slashtags */
/** @typedef {import('../../interfaces').HypercoreAPI} HypercoreAPI */
/** @typedef {import('../../interfaces').HyperswarmAPI} HyperswarmAPI */
