/**
 *
 * @param {boolean} [useRelay]
 * @returns
 */
export function getSwarmOpts (useRelay = false) {
  const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env
  const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP)

  return {
    bootstrap,
    relays: process.title !== 'node' || useRelay ? [RELAY_URL] : undefined
  }
}
