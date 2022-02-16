import type { Slashtags } from './index'

export type PluginOptions = Record<string, any>

export interface Plugin<O extends PluginOptions = {}> {
  (instance: Slashtags, options?: O): Promise<void>
}

export interface emit {
  (type: string, ...args: any[]): boolean
  (type: string, ...args: any[]): Promise<boolean>
}

export interface SlashtagsOptions {
  logger: typeof console
}
