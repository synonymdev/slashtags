import { slashHypercore } from '../../hyper/hypercore/index.js'
import { SlashDIDEncoding } from './encoding.js'
import { formatDidUri, parseDidUri } from './url-utils.js'

/** @implements {IdentityProvider} */
export class SlashDIDProvider {
  /** @param {{slash: Slashtags}} options */
  constructor (options) {
    this.slash = options.slash
    this.slash.use(slashHypercore)
  }

  /** @param {Parameters<IdentityProvider['createIdentifier']>[0]} options */
  async createIdentifier (options) {
    const core = await this.slash.hypercoreCreate({
      keyPair: options.keyPair,
      valueEncoding: SlashDIDEncoding,
      lookup: false,
      announce: true
    })
    if (options.services) {
      await this.slash.hypercoreAppend({
        key: core.key,
        data: {
          services: options.services
        }
      })
    }

    const did = formatDidUri(core.key)

    return { did }
  }

  /** @param {Parameters<IdentityProvider['getIdentifier']>[0]} options */
  async getIdentifier (options) {
    const { key } = parseDidUri(options.did)

    await this.slash.hypercoreCreate({
      key,
      valueEncoding: SlashDIDEncoding,
      lookup: true
    })
    const data = (await this.slash.hypercoreGet({ key })) || {}

    if (!data?.services) delete data.services
    if (!data?.keys) delete data.keys

    return data
  }

  /** @param {Parameters<IdentityProvider['upsertServices']>[0]} options */
  async upsertServices (options) {
    // TODO: don't append a new block if it has the same data
    const { key } = parseDidUri(options.did)
    const old = await this.slash.hypercoreGet({ key })

    if (!old?.services) delete old.services
    if (!old?.keys) delete old.keys

    const newServices = Object.values(
      [...old.services, ...(options.services || [])].reduce((prev, service) => {
        return { ...prev, [service.id]: service }
      }, {})
    )

    const newIdentifier = {
      ...old,
      services: newServices
    }

    await this.slash.hypercoreAppend({ key, data: newIdentifier })

    return newIdentifier
  }
}

/** @typedef {import('../../interfaces').IdentityProvider} IdentityProvider */
/** @typedef {import('../../interfaces').Slashtags} Slashtags */
