import { SDK } from '../../src/index.js'

const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env
const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP)

const relays = process.title !== 'node' ? [RELAY_URL] : undefined

export function sdk (opts) {
  return SDK.init({
    swarmOpts: {
      bootstrap,
      relays
    },
    persist: false,
    ...opts
  })
}
