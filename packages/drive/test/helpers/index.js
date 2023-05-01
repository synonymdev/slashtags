const path = require('path')
const os = require('os')

function tmpdir () {
  return path.join(os.tmpdir(), 'drivestore-' + Math.random().toString(16).slice(2))
}

module.exports = {
  tmpdir
}
