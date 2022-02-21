// @ts-ignore
import Corestore from 'corestore';
// @ts-ignore
import RAM from 'random-access-memory';
import b4a from 'b4a';

const DEFAULT_CORE_OPTS = {
  sparse: true,
  persist: true,
  keyEncoding: 'utf8',
  valueEncoding: 'json',
};

/**
 *
 * @param {import('../../interfaces').Slashtags} slash
 * @param {{}} [options]
 */
export async function slashHypercore(slash, options) {
  const corestore = new Corestore(RAM);

  slash.onReady(corestore.ready);

  // TODO use turbo hashmap
  const openCores = new Map();

  /** @param {*} [options] */
  const getCore = async (options) => {
    const key = options?.key || options?.keyPair?.publicKey;
    let core;

    const keyHex = b4a.toString(key, 'hex');

    if (openCores.has(keyHex)) {
      core = openCores.get(keyHex);
    } else {
      core = corestore.get({
        ...DEFAULT_CORE_OPTS,
        ...options,
      });

      openCores.set(key, core);
    }

    await core.ready();
    await core.update();

    return core;
  };

  /** @type {import('../../interfaces').HypercoreExt['hypercoreCreate']} */
  async function hypercoreCreate(options) {
    const core = await getCore(options);
    return { key: core.key };
  }

  /** @type {import('../../interfaces').HypercoreExt['hypercoreAppend']} */
  async function hypercoreAppend(options) {
    const core = await getCore(options);
    return core.append(options.data);
  }

  /** @type {import('../../interfaces').HypercoreExt['hypercoreGet']} */
  async function hypercoreGet(options) {
    const core = await getCore(options);

    if (core.length < 1) return null;

    const seq = options.seq || core.length - 1;
    const data = await core.get(seq);

    return data;
  }

  slash.decorate('hypercoreCreate', hypercoreCreate);
  slash.decorate('hypercoreAppend', hypercoreAppend);
  slash.decorate('hypercoreGet', hypercoreGet);
}
