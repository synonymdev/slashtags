export function swarmOpts() {
  const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env;
  const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP);

  return {
    bootstrap,
    relays: [RELAY_URL],
  };
}
