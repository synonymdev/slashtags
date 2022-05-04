const fs = require('fs')

module.exports.getTestnetConfig = function getTestnetConfig () {
  try {
    const file = fs.readFileSync('../../.testnet.json', 'utf8').toString()
    return JSON.parse(file)
  } catch (error) {
    throw new Error('No testnet config found. Run `npm run testnet` first.')
  }
}
