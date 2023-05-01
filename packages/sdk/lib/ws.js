// Bitkit has a better time with explicit imports
// browser: { './lib/ws.js': './lib/ws.browser.js' } vs { 'ws': './lib/ws.browser.js' }
const ws = require('ws')

module.exports = ws
