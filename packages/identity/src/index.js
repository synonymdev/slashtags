import b4a from 'b4a'
import sodium from 'sodium-universal'

import { SlashDIDProvider } from './providers/slash/index.js'

export const events = {
  IDENTIFIER_CREATED: 'IDENTITY_IDENTIFIER_CREATED'
}

function generateKeyPair () {
  const keyPair = {
    publicKey: Buffer.alloc(32),
    secretKey: Buffer.alloc(64)
  }

  const privateKey = b4a.alloc(32)
  sodium.randombytes_buf(privateKey)

  sodium.crypto_sign_seed_keypair(
    keyPair.publicKey,
    keyPair.secretKey,
    privateKey
  )

  return keyPair
}

/**
 *
 * @param {Slashtags} slash
 * @param {*} [options]
 */
export async function slashIdentity (slash, options) {
  // Setup
  /** @type {IdentityProvider} */
  const providers = {
    slash: new SlashDIDProvider({ slash })
  }
  const DefaultProvider = 'slash'

  // API extension
  slash.decorate('identityCreate', identityCreate)
  slash.decorate('identityGet', identityGet)
  slash.decorate('identityUpsertServices', identityUpsertServices)

  // API Implementation

  /** @type {Slashtags['identityCreate']} */
  async function identityCreate (options) {
    const providerName = DefaultProvider
    const provider = providers[providerName]

    const opts = { ...options }
    // TODO: switch this with a keychain generator
    if (!opts.keyPair) opts.keyPair = generateKeyPair()

    const identifier = await provider.createIdentifier(
      // @ts-ignore
      opts
    )

    slash.emit(events.IDENTIFIER_CREATED, identifier)
    return identifier
  }

  /** @param {string} did */
  const providerFromDID = (did) => providers[did.split(':')[1].split(':')[0]]

  /** @type {Slashtags['identityGet']} */
  async function identityGet (options) {
    const did = options.did

    const provider = providerFromDID(did)
    const identifier = await provider.getIdentifier({ did })

    return {
      ...identifier,
      did
    }
  }

  /** @type {Slashtags['identityUpsertServices']} */
  async function identityUpsertServices (options) {
    const did = options.did

    const provider = providerFromDID(did)
    const identifier = await provider.upsertServices({
      ...options,
      did
    })

    return {
      ...identifier,
      did
    }
  }
}

/** @typedef {Record<string, import('./interfaces').IdentityProvider>} IdentityProvider */
/** @typedef {import('./interfaces').Slashtags} Slashtags */
