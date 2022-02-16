import type { Plugin } from '../../../src/interfaces'

interface PluginOptions {
  fooA: string
}

declare module '../../../src/index.js' {
  interface Slashtags {
    fooA: string
    makeFoo: () => string
  }
}

export type PluginA = Plugin<PluginOptions>

export default PluginA
