const RAM = require('random-access-memory')

/**
 * Default storage in browser environment.
 */
// TODO support browser storage OR storing to remote Slashtags desktop node.
const defaultStorage = () => new RAM()

module.exports = {
  defaultStorage
}
