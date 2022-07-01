'use strict';
'use strict';
const path = require('path');

const { getTestnetConfig } = require('../../scripts/testnet-config.js');

const esbuild = {
  inject: [path.join(__dirname, '../../scripts/node-globals.js')],
};

module.exports = {
  test: {
    browser: {
      config: {
        buildConfig: esbuild,
      },
    },
    async before(options) {
      const config = getTestnetConfig();
      const bootstrap = config.bootstrap;

      return {
        env: {
          BOOTSTRAP: JSON.stringify(bootstrap),
          RELAY_URL: config.relay,
        },
      };
    },
  },
  build: {
    config: esbuild,
  },
};

