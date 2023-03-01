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

export const REQUESTS = {
  SEEDER_ADD: 'SEEDER_ADD_REQUEST',
  SEEDER_REMOVE: 'SEEDER_REMOVE_REQUEST',
  SEEDER_LIST: 'SEEDER_LIST_REQUEST'
}

export const RESPONSES = {
  SEEDER_ADD: 'SEEDER_ADD_RESPONSE',
  SEEDER_REMOVE: 'SEEDER_REMOVE_RESPONSE',
  SEEDER_LIST: 'SEEDER_LIST_RESPONSE'
}
