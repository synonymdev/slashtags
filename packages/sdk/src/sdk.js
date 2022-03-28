import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import { DHT } from 'dht-universal'
import RAM from 'random-access-memory'
import goodbye from 'graceful-goodbye'

import { KeyManager } from './keys.js'

export class SDK {
  constructor (opts) {
    this.store = new Corestore(opts.storage || RAM)
    this.keys = new KeyManager(opts?.profile)
    this.opts = opts

    this.ready = (async () => {
      this.dht = await DHT.create(this.opts)
      this.swarm = new Hyperswarm({ dht: this.dht })

      this.swarm.on('connection', (noiseSocket) => {
        this.store.replicate(noiseSocket)
      })
    })()

    // Gracefully shutdown
    goodbye(() => {
      return this.close()
    })
  }

  static async init (opts) {
    const sdk = new SDK(opts)
    await sdk.ready
    return sdk
  }

  async hypercore (opts) {
    const keys = opts.keys || this.keys
    if (opts.name) {
      opts.keyPair = keys.createKeyPair(opts.name)
      delete opts.name
    }
    const core = this.store.get(opts)
    await core.ready()

    if (Boolean(opts.announce) || Boolean(opts.lookup)) {
      await this.swarm
        .join(core.discoveryKey, {
          server: opts.announce || false,
          client: opts.lookup || false
        })
        .flushed()
    }

    await core.update()

    return core
  }

  async close () {
    await this.store.close()
    return this.swarm.destroy()
  }
}
