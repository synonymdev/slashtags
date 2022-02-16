/** @type {import ('./index').PluginB} */
export async function pluginB (slash, options) {
  slash.decorate('fooB', options?.fooB)
}
