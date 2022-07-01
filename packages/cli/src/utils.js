import { createRequire } from 'module'
// @ts-ignore
const require = createRequire(import.meta.url)
const pjson = require('../package.json')

export const version = pjson.version
