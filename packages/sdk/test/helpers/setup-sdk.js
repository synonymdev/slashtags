import { SDK } from '../../src/index.js'

const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env
const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP)

export function sdk (opts) {
  return SDK.init({
    swarmOpts: {
      bootstrap,
      relays: [RELAY_URL]
    },
    persistent: false,
    ...opts
  })
}
