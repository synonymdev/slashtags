// The one process that contains all networking resources, database, etc.
import { Level } from 'level'

import { DEFAULT_PORT, REQUESTS, SEEDER_DATABASE_DIRECTORY } from '../constants.js'
import Seeder from './seeder.js'
import runRelay from './relay.js'
import { respond } from '../utils.js'

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
    case REQUESTS.SEEDER_ADD:
      seeder.add(request.payload.urls)
        .then(() => {
          respond(event.target, 'SEEDER_ADD', { status: 'ok' })
        })
      break
    case REQUESTS.SEEDER_REMOVE:
      seeder.remove(request.payload.urls)
        .then(() => {
          respond(event.target, 'SEEDER_REMOVE', { status: 'ok' })
        })
      break
    case REQUESTS.SEEDER_LIST:
      seeder.list()
        .then(urls => {
          respond(event.target, 'SEEDER_LIST', { urls })
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
