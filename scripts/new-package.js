const path = require('path')
const fs = require('fs')

const packagejson = (name, description) => `{
  "name": "@synonymdev/${name}",
  "version": "0.0.0",
  "description": "${description}",
  "license": "MIT",
  "homepage": "https://github.com/synonymdev/slashtags/tree/master/packages/${name}/#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/synonymdev/slashtags.git"
  },
  "bugs": {
    "url": "https://github.com/synonymdev/slashtags/issues"
  },
  "keywords": [],
  "type": "module",
  "types": "types/src/index.d.ts",
  "typesVersions": {
    "*": {
      "*": [
        "types/*",
        "types/src/*"
      ],
      "types/*": [
        "types/*",
        "types/src/*"
      ]
    }
  },
  "files": [
    "*",
    "!**/*.tsbuildinfo"
  ],
  "main": "src/index.js",
  "scripts": {
    "build": "aegir build",
    "test": "c8 aegir test",
    "lint": "standard --fix",
    "clean": "rimraf ./dist",
    "depcheck": "npx aegir dep-check"
  },
  "standard": {
    "env": [
      "mocha"
    ]
  },
  "dependencies": {
  },
  "devDependencies": {
    "aegir": "^37.0.15"
  }
}`

const tsconfig = `{
  "extends": "aegir/src/config/tsconfig.aegir.json",
  "compilerOptions": { "outDir": "types" },
  "include": ["src", "package.json", "../../types"],
  "references": []
}`

const defaultIndex = `/**
 * @param {number} a
 * @param {number} b
 */
export const add = (a, b) => {
  return a + b
}
`

const defaultAegir = `'use strict';
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

`

const defaultTest = `import { expect } from 'aegir/chai';
import { add } from '../src/index.js';

describe('index', () => {
  it('should add 2 + 2', async () => {
    expect(add(2, 2)).to.equal(4);
  });
});
`

const main = () => {
  const name = process.argv[2]
  const description = process.argv[3] || ''
  if (!name) throw new Error('Package name is required')

  const _path = path.join(__dirname).replace(/scripts$/, 'packages/' + name)
  fs.mkdirSync(_path)
  fs.writeFileSync(
    path.join(_path, 'package.json'),
    packagejson(name, description)
  )
  fs.writeFileSync(path.join(_path, 'tsconfig.json'), tsconfig)
  fs.writeFileSync(path.join(_path, '.aegir.cjs'), defaultAegir)
  fs.writeFileSync(path.join(_path, 'README.md'), '# slashtags-' + name)
  fs.mkdirSync(path.join(_path, 'src'))
  fs.mkdirSync(path.join(_path, 'test'))
  fs.writeFileSync(path.join(_path, 'src/index.js'), defaultIndex)
  fs.writeFileSync(path.join(_path, 'test/index.spec.js'), defaultTest)
}

main()
