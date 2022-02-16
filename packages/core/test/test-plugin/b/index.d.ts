import type { Plugin } from '../../../src/interfaces'

interface PluginOptions {
  fooB: string
}

declare module '../../../src/index' {
  interface Slashtags {
    fooB: string
  }
}

export type PluginB = Plugin<PluginOptions>

export default PluginB
