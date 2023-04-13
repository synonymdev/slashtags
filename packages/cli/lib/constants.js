const path = require('path')
const os = require('os')
const pjson = require('../package.json')

const ROOT_DIR = path.join(__dirname, '../')
const DEFAULT_PORT = 45475
const VERSION = pjson.version

const SEEDER_STORE_DIRECTORY = path.join(os.homedir(), '.slashtags', 'daemon', 'seeder')
const SEEDER_DATABASE_DIRECTORY = path.join(os.homedir(), '.slashtags', 'daemon', 'database')

const REQUESTS = {
  SEEDER_ADD: 'SEEDER_ADD_REQUEST',
  SEEDER_REMOVE: 'SEEDER_REMOVE_REQUEST',
  SEEDER_LIST: 'SEEDER_LIST_REQUEST'
}

const RESPONSES = {
  SEEDER_ADD: 'SEEDER_ADD_RESPONSE',
  SEEDER_REMOVE: 'SEEDER_REMOVE_RESPONSE',
  SEEDER_LIST: 'SEEDER_LIST_RESPONSE'
}

module.exports = {
  ROOT_DIR,
  DEFAULT_PORT,
  VERSION,
  SEEDER_STORE_DIRECTORY,
  SEEDER_DATABASE_DIRECTORY,
  REQUESTS,
  RESPONSES
}
