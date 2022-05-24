const fs = require('fs')
const path = require('path')

const RELATIVE_PATH = '../.testnet.json'

module.exports.getTestnetConfig = function getTestnetConfig () {
  try {
    const file = fs
      .readFileSync(path.join(__dirname, RELATIVE_PATH), 'utf8')
      .toString()
    return JSON.parse(file)
  } catch (error) {
    throw new Error(
      'No testnet config found. Run `npm run testnet:start` first.'
    )
  }
}
