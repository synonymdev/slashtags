import { SDK } from '../../src/sdk.js'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

export function sdk (opts) {
  return SDK.init({
    bootstrap,
    relays: [RELAY_URL],
    persistent: false,
    ...opts
  })
}
