// The one process that contains all networking resources, database, etc.
import { Level } from 'level'

import { DEFAULT_PORT, MESSAGES, SEEDER_DATABASE_DIRECTORY } from '../constants.js'
import Seeder from './seeder.js'
import runRelay from './relay.js'

const { dht, server } = runRelay({ port: DEFAULT_PORT })

server.on('connection', (socket) => {
  socket.onmessage = onMessage
})

const db = new Level(SEEDER_DATABASE_DIRECTORY, { valueEncoding: 'json' })

const seederDB = db.sublevel('seeder')
const seeder = new Seeder(dht, seederDB)

/**
 * @param {import('ws').MessageEvent} event
 */
function onMessage (event) {
  const request = tryParseJSON(event.data)
  if (!request) return

  switch (request.type) {
    case MESSAGES.SEEDER_ADD:
      seeder.add(request.payload.urls)
      break
    case MESSAGES.SEEDER_REMOVE:
      seeder.remove(request.payload.urls)
      break
    case MESSAGES.SEEDER_LIST:
      seeder.list().then(urls => {
        event.target.send(JSON.stringify(urls))
      })
      break
    default:
      break
  }
}

/**
 * @returns {object | undefined}
 */
function tryParseJSON (string) {
  try {
    return JSON.parse(string)
  } catch {}
}

/**
 * @typedef {ConstructorParameters<typeof import('@hyperswarm/dht')>[0]} DHTOpts
 */
