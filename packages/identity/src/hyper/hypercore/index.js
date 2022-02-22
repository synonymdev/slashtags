// @ts-ignore
import Corestore from 'corestore'
// @ts-ignore
import RAM from 'random-access-memory'
import b4a from 'b4a'
import { events } from '../hyperswarm/index.js'

const DEFAULT_CORE_OPTS = {
  sparse: true,
  persist: true,
  keyEncoding: 'utf8',
  valueEncoding: 'json'
}

/**
 *
 * @param {Slashtags} slash
 * @param {*} [options]
 */
export async function slashHypercore (slash, options) {
  // Setup
  const corestore = new Corestore(RAM)

  // Hooks
  slash.onReady(async () => {
    await corestore.ready()
    // @ts-ignore
    await slash.emit(events.ON_CONNECTION, (conn) => corestore.replicate(conn))
  })
  slash.onClose(async () => corestore.close())

  // API extension
  slash.decorate('hypercoreCreate', hypercoreCreate)
  slash.decorate('hypercoreAppend', hypercoreAppend)
  slash.decorate('hypercoreGet', hypercoreGet)

  // API Implementation

  // TODO use turbo hashmap
  const openCores = new Map()

  /** @param {*} [options] */
  const getCore = async (options) => {
    const key = options?.key || options?.keyPair?.publicKey
    let core

    const keyHex = b4a.toString(key, 'hex')

    if (openCores.has(keyHex)) {
      core = openCores.get(keyHex)
    } else {
      core = corestore.get({
        ...DEFAULT_CORE_OPTS,
        ...options
      })

      openCores.set(keyHex, core)
    }

    await core.ready()

    await slash.emit(events.JOIN, core.discoveryKey, options)

    await core.update()

    return core
  }

  /** @type {HypercoreAPI['hypercoreCreate']} */
  async function hypercoreCreate (options) {
    const core = await getCore(options)
    return { key: core.key }
  }

  /** @type {HypercoreAPI['hypercoreAppend']} */
  async function hypercoreAppend (options) {
    const core = await getCore(options)
    return core.append(options.data)
  }

  /** @type {HypercoreAPI['hypercoreGet']} */
  async function hypercoreGet (options) {
    const core = await getCore(options)
    await core.update()

    if (core.length < 1) return null
    const seq = options.seq || core.length - 1
    const data = await core.get(seq)

    return data
  }
}

/** @typedef {import('../../interfaces').Slashtags} Slashtags */
/** @typedef {import('../../interfaces').HypercoreAPI} HypercoreAPI */
/** @typedef {import('../../interfaces').HyperswarmAPI} HyperswarmAPI */
