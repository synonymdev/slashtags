const { homedir } = require('os')

const DEFAULT_DIRECTORY = '.slashtags'
const DEFAULT_DIRECTORY_PATH = homedir() + '/' + DEFAULT_DIRECTORY

/**
 * Default storage in Nodejs environment.
 */
const defaultStorage = DEFAULT_DIRECTORY_PATH

module.exports = {
  defaultStorage
}
