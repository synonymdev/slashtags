'use strict';
const path = require('path');

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
  },
  build: {
    config: esbuild,
  },
};
