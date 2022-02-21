import b4a from 'b4a';
import sodium from 'sodium-universal';

import { SlashDIDProvider } from './providers/slash/index.js';

function generateKeyPair() {
  const keyPair = {
    publicKey: Buffer.alloc(32),
    secretKey: Buffer.alloc(64),
  };

  const privateKey = b4a.alloc(32);
  sodium.randombytes_buf(privateKey);

  sodium.crypto_sign_seed_keypair(
    keyPair.publicKey,
    keyPair.secretKey,
    privateKey,
  );

  return keyPair;
}

/**
 *
 * @param {import('./interfaces').Slashtags} slash
 * @param {import('./interfaces').IdentityOptions} [options]
 */
export async function slashIdentity(slash, options) {
  /** @type {Record<string, import('./interfaces').IdentityProvider>} */
  const providers = {
    slash: new SlashDIDProvider({ slash }),
  };
  const DefaultProvider = 'slash';

  /** @type {import('./interfaces').Slashtags['identityCreate']} */
  async function identityCreate(options) {
    const providerName = DefaultProvider;
    const provider = providers[providerName];

    const opts = { ...options };
    // TODO: switch this with a keychain generator
    if (!opts.keyPair) opts.keyPair = generateKeyPair();

    const identifier = await provider.createIdentifier(
      // @ts-ignore
      opts,
    );

    slash.emit('identityCreated', identifier);
    return identifier;
  }

  /** @param {string} did */
  const providerFromDID = (did) => providers[did.split(':')[1].split(':')[0]];

  /** @type {import('./interfaces').Slashtags['identityGet']} */
  async function identityGet(options) {
    const did = options.did;

    const provider = providerFromDID(did);
    const identifier = await provider.getIdentifier({ did });

    return {
      ...identifier,
      did,
    };
  }

  /** @type {import('./interfaces').Slashtags['identityUpsertServices']} */
  async function identityUpsertServices(options) {
    const did = options.did;

    const provider = providerFromDID(did);
    const identifier = await provider.upsertServices({
      ...options,
      did,
    });

    return {
      ...identifier,
      did,
    };
  }

  slash.decorate('identityCreate', identityCreate);
  slash.decorate('identityGet', identityGet);
  slash.decorate('identityUpsertServices', identityUpsertServices);
}
