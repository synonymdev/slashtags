'use strict';
const path = require('path');
const { setupTestnet } = require('../../scripts/setup-testnet');

const esbuild = {
  inject: [path.join(__dirname, '../../scripts/node-globals.js')],
};

/** @type {import('aegir').PartialOptions} */
module.exports = {
  test: {
    browser: {
      config: {
        buildConfig: esbuild,
      },
    },
    async before(options) {
      const { bootstrap, relay, closeBootstrap, closeRelay } =
        await setupTestnet();

      return {
        closeRelay,
        closeBootstrap,
        env: {
          BOOTSTRAP: JSON.stringify(bootstrap),
          RELAY_URL: relay,
        },
      };
    },
    async after(options, before) {
      await before.closeRelay();
      await before.closeBootstrap();
    },
  },
  build: {
    config: esbuild,
  },
};
