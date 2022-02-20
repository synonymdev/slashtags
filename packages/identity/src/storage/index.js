import { storageDirectory } from './storage.js';

/**
 *
 * @param {import('../interfaces').Slashtags} slash
 * @param {{}} [options]
 */
export async function slashStorage(slash, options) {
  const storageDir = await storageDirectory();
  const relativePath = (/** @type {string}*/ path) => storageDir + path;

  slash.decorate('storageRelativePath', relativePath);
}
