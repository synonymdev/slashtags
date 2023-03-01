import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import * as SlashURL from '@synonymdev/slashtags-url'
import HyperDrive from 'hyperdrive'

import { SEEDER_STORE_DIRECTORY } from '../constants.js'

const SEEDERS_TOPIC = Buffer.from('3b9f8ccd062ca9fc0b7dd407b4cd287ca6e2d8b32f046d7958fa7bea4d78fd75', 'hex')

export default class Seeder {
  /**
   * @param {import('@hyperswarm/dht')} dht
   * @param {import('level').Level<string, object>} db
   */
  constructor (dht, db) {
    this.swarm = new Hyperswarm({ dht })
    this.corestore = new Corestore(SEEDER_STORE_DIRECTORY)

    this.swarm.on('connection', (conn, peerInfo) => {
      console.log('Got peer connection', peerInfo.publicKey.toString('hex'))
      this.corestore.replicate(conn)
    })

    this.db = db

    this._open()

    /** Drives being seeded at the moment */
    this._drives = new Map()
  }

  async _open () {
    for await (const [url] of this.db.iterator()) {
      this._seed(url)
    }
  }

  /**
   * @param {string} url
   */
  async _seed (url) {
    if (this._drives.has(url)) return

    const key = SlashURL.parse(url).key

    const drive = new HyperDrive(this.corestore, key)
    await drive.ready()

    this._drives.set(url, drive)

    // TODO: Only to connect to seeders, remove if/when we get rid of seeders topic
    this.swarm.join(SEEDERS_TOPIC, { server: false, client: true })

    await this.swarm.join(drive.discoveryKey, { server: true, client: false })
      .flushed()

    drive.core.download()

    await drive.getBlobs().then(blobs => {
      blobs.core.download()
    })

    console.log('Start seeding public drive for', url)
  }

  /**
   * @param {string} url
   */
  async _unseed (url) {
    /** @type {import('hyperdrive')} */
    const drive = this._drives.get(url)
    if (!drive) {
      console.log("This slashtag wasn't being seeded", url)
      return
    }

    await this.swarm.join(drive.discoveryKey, { server: false, client: false }).flushed()
    await drive.close()

    console.log('Stopped seeding public drive for', url)
  }

  async list () {
    const _list = []
    for await (const [url] of this.db.iterator()) {
      _list.push(url)
    }
    return _list
  }

  /**
   * @param {string[]} urls
   */
  async add (urls) {
    const batch = this.db.batch()
    for (let url of urls) {
      try {
        url = handleKey(url)
        SlashURL.parse(url)
        batch.put(url, {})
        this._seed(url)
      } catch (error) {
        console.log('Invalid url', url)
        return
      }
    }
    await batch.write()
  }

  /**
   * @param {string[]} urls
   */
  async remove (urls) {
    const batch = this.db.batch()
    for (let url of urls) {
      try {
        url = handleKey(url)
        SlashURL.parse(url)
        batch.del(url)
        this._unseed(url)
      } catch (error) {
        console.log('Invalid url', url)
        return
      }
    }
    await batch.write()
  }
}

function handleKey (keyString) {
  try {
    SlashURL.decode(keyString)
    return 'slash:' + keyString
  } catch (error) {
    return keyString
  }
}
