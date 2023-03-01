import WebSocket from 'ws'
import { DEFAULT_PORT } from '../constants.js'
import { request } from '../utils.js'
import { NOT_RUNNING } from './daemon.js'

const ADDRESS = 'ws://localhost:' + DEFAULT_PORT

seeder.usage = `

  slash seeder list          - List of slashtags to be seeded while running the daemon.
  slash seeder add [urls]    - Start seeding list of slashtags.
  slash seeder remove [urls] - Stop seeding list of slasthags.
`

seeder.description = 'Add, remove, or list seeded slashtags'

seeder.summary = 'seeder commands'

export default function seeder (type, _, command) {
  const urls = command.args.slice(1)
  const socket = new WebSocket(ADDRESS)

  const timeout = setTimeout(() => {
    console.log('Timeout...')
    socket.close()
  }, 2000)

  socket.onerror = onError

  function close () {
    clearTimeout(timeout)
    socket.close()
  }

  socket.onopen = () => {
    switch (type) {
      case 'add':
        request(socket, 'SEEDER_ADD', { urls })
        close()
        break
      case 'remove':
        request(socket, 'SEEDER_REMOVE', { urls })
        close()
        break
      case 'list':
        socket.onmessage = (event) => {
          try {
            const urls = JSON.parse(event.data.toString())
            console.log('Slashtags saved to be seed while demon is running:')
            urls.forEach(url => {
              console.log('-', url)
            })

            clearTimeout(timeout)
            close()
          } catch {}
        }
        request(socket, 'SEEDER_LIST', { urls })
        break
      default:
        break
    }
  }
}

/**
 * @param {import('ws').ErrorEvent} err
 */
function onError (err) {
  if (err.error.code === 'ECONNREFUSED') {
    console.log(NOT_RUNNING)
  }
}
