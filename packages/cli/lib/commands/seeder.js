const WebSocket = require('ws')
const { DEFAULT_PORT, REQUESTS, RESPONSES } = require('../constants.js')
const { request } = require('../utils.js')
const { NOT_RUNNING } = require('./daemon.js')

const ADDRESS = 'ws://localhost:' + DEFAULT_PORT

seeder.usage = `

  slash seeder list          - List of slashtags to be seeded while running the daemon.
  slash seeder add [urls]    - Start seeding list of slashtags.
  slash seeder remove [urls] - Stop seeding list of slasthags.
`

seeder.description = 'Add, remove, or list seeded slashtags'

seeder.summary = 'seeder commands'

function seeder (type, _, command) {
  const urls = command.args.slice(1)
  const socket = new WebSocket(ADDRESS)

  socket.onopen = () => {
    switch (type) {
      case 'add':
        request(socket, REQUESTS.SEEDER_ADD, { urls })
        break
      case 'remove':
        request(socket, REQUESTS.SEEDER_REMOVE, { urls })
        break
      case 'list':
        request(socket, REQUESTS.SEEDER_LIST, { urls })
        break
      default:
        break
    }
  }

  socket.onerror = function (err) {
    if (err.error.code === 'ECONNREFUSED') {
      console.log(NOT_RUNNING)
    }
    close()
  }

  socket.onmessage = (event) => {
    try {
      const response = JSON.parse(event.data.toString())
      switch (response.type) {
        case RESPONSES.SEEDER_ADD:
          urls.length > 0 && console.log('Seeding...')
          break
        case RESPONSES.SEEDER_REMOVE:
          urls.length > 0 && console.log('Stopped seeding')
          break
        case RESPONSES.SEEDER_LIST:
          if (response.payload.urls.length > 0) {
            console.log('Slashtags saved to be seed while demon is running:')
            response.payload.urls.forEach(url => {
              console.log('-', url)
            })
          } else {
            console.log('Not seeding any slashtags.')
          }
          break
      }

      close()
    } catch { }
  }

  const timeout = setTimeout(() => {
    console.log('Timeout...')
    socket.close()
  }, 4000)

  function close () {
    clearTimeout(timeout)
    socket.close()
  }
}

module.exports = seeder
