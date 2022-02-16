/** @type {import ('./index').PluginA} */
export async function pluginA (slash, options) {
  slash.decorate('fooA', options?.fooA)
  slash.decorate('makeFoo', () => 'made ' + options?.fooA)
}
