const path = require('path')
const fs = require('fs')

/** @param {string} name */
const packagejson = name => `{
  "name": "@synonymdev/${name}",
  "version": "0.0.0",
  "description": "${name}",
  "type": "module",
  "main": "index.js",
  "types": "types/index.d.ts",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/synonymdev/slashtags.git"
  },
  "scripts": {
    "build": "tsc",
    "clean": "rimraf types",
    "lint": "standard --fix",
    "test": "brittle test/** -cov",
    "depcheck": "npx depcheck",
    "fullcheck": "npm run lint && npm run clean && npm run build && npm run test && npm run depcheck",
    "prepublishOnly": "npm run fullcheck"
  },
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/synonymdev/slashtags/issues"
  },
  "homepage": "https://github.com/synonymdev/slashtags/tree/master/packages/${name}/#readme",
  "files": [
    "index.js",
    "lib",
    "types",
    "!**/*.tsbuildinfo"
  ],
  "dependencies": {},
  "devDependencies": {
    "brittle": "^3.0.2",
    "depcheck": "^1.4.3",
    "standard": "^17.0.0",
    "typescript": "^4.8.2"
  }
}`

const tsconfig = `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "types"
  },
  "include": ["index.js", "lib", "test", "../../declarations.d.ts"]
}`

const defaultIndex = `/**
 * @param {number} a
 * @param {number} b
 */
export const add = (a, b) => {
  return a + b
}
`

const defaultTest = `import test from 'brittle'

import { add } from '../index.js';

test('add', (t) => {
  t.is(add(2, 2), 4)
})
`

/** @param {string} name */
const defaultReadme = name => `# ${name}

...

## Installation

\`\`\`
npm install @synonymdev/${name}
\`\`\`

## Usage

## API

#### \`const number = add(a, b)\`
`

const main = () => {
  const dir = process.argv[2]
  if (!dir) throw new Error('Package name is required')

  const _path = path.join(__dirname).replace(/scripts$/, 'packages/' + dir)
  fs.mkdirSync(_path)
  fs.writeFileSync(path.join(_path, 'package.json'), packagejson(dir))
  fs.writeFileSync(path.join(_path, 'tsconfig.json'), tsconfig)
  fs.writeFileSync(path.join(_path, 'README.md'), defaultReadme(dir))
  fs.mkdirSync(path.join(_path, 'lib'))
  fs.mkdirSync(path.join(_path, 'test'))
  fs.writeFileSync(path.join(_path, 'index.js'), defaultIndex)
  fs.writeFileSync(path.join(_path, 'test/all.js'), defaultTest)
}

main()
