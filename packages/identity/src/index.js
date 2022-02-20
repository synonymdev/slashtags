import level from 'level';
import b4a from 'b4a';
import sodium from 'sodium-universal';
import { derivePath } from 'ed25519-hd-key';

import { slashStorage } from './storage/index.js';

/**
 *
 * @param {import('./interfaces').Slashtags} slash
 * @param {{}} [options]
 */
async function slashDataStore(slash, options) {
  await slash.use(slashStorage);

  /** @type {import('./interfaces').Slashtags['dataStoreCreateDB']} */
  async function dataStoreCreateDB(options) {
    return level(slash.storageRelativePath('/' + options.dbName));
  }

  slash.decorate('dataStoreCreateDB', dataStoreCreateDB);
}

/**
 *
 * @param {import('./interfaces').Slashtags} slash
 * @param {{}} [options]
 */
export async function slashKeyChain(slash, options) {
  await slash.use(slashDataStore);
  const keyChainDB = await slash.dataStoreCreateDB({ dbName: 'keyChain' });

  /** @type {string} */
  // @ts-ignore
  let seedHex = undefined;
  let offset = 1;

  try {
    seedHex = await keyChainDB.get('seed');
    offset = await keyChainDB.get('offset-Ed25519');
  } catch (error) {}

  if (!seedHex) {
    const seed = b4a.alloc(64);
    sodium.randombytes_buf(seed);

    seedHex = b4a.toString(seed, 'hex');

    keyChainDB.put('seed', seedHex);
  }

  const Path = "m/84263362'";

  /** @type {import('./interfaces').Slashtags['keyChainGenerateKey']} */
  function keyChainGenerateKey(options) {
    let next;
    if (options?.offset) {
      next = options.offset;
    } else {
      next = offset++;
    }
    const { key } = derivePath(`${Path}/${next}'`, seedHex);
    return { secretKey: key, type: 'Ed25519' };
  }
  slash.decorate('keyChainGenerateKey', keyChainGenerateKey);

  return;
}

/**
 *
 * @param {import('./interfaces').Slashtags} slash
 * @param {{}} [options]
 */
export async function slashIdentity(slash, options) {
  try {
    await slash.use(slashKeyChain);
  } catch (error) {
    console.log(error);
  }

  /** @type {import('./interfaces').Slashtags['identityCreate']} */
  async function identityCreate(options) {
    const privateKey = slash.keyChainGenerateKey();
    return {};
  }

  slash.decorate('identityCreate', identityCreate);
}
