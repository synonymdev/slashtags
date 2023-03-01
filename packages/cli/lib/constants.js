import path from 'path'
import os from 'os'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pjson = require('../package.json')

export const ROOT_DIR = path.join(import.meta.url.slice(5), '../../')
export const DEFAULT_PORT = 45475
export const VERSION = pjson.version

export const SEEDER_STORE_DIRECTORY = path.join(os.homedir(), '.slashtags', 'daemon', 'seeder')
export const SEEDER_DATABASE_DIRECTORY = path.join(os.homedir(), '.slashtags', 'daemon', 'database')

export const MESSAGES = {
  SEEDER_ADD: 'SEEDER.ADD',
  SEEDER_REMOVE: 'SEEDER.REMOVE',
  SEEDER_LIST: 'SEEDER_LIST'
}
