import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pjson = require('../package.json')

export const ROOT_DIR = path.join(import.meta.url.slice(5), '../../')
export const DEFAULT_PORT = 45475
export const VERSION = pjson.version
