// Bitkit has a better time with explicit imports
// browser: { './lib/ws.js': './lib/ws.browser.js' } vs { 'ws': './lib/ws.browser.js' }
import ws from 'ws'
export default ws
