// The one process that contains all networking resources, database, etc.
const { Level } = require('level')

const { DEFAULT_PORT, REQUESTS, RESPONSES, SEEDER_DATABASE_DIRECTORY } = require('../constants.js')
const Seeder = require('./seeder.js')
const runRelay = require('./relay.js')
const { respond } = require('../utils.js')

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
  let request
  try {
    request = JSON.parse(event.data.toString())
  } catch (error) {
    return
  }

  switch (request.type) {
    case REQUESTS.SEEDER_ADD:
      seeder.add(request.payload.urls)
        .then(() => {
          respond(event.target, RESPONSES.SEEDER_ADD, { status: 'ok' })
        })
      break
    case REQUESTS.SEEDER_REMOVE:
      seeder.remove(request.payload.urls)
        .then(() => {
          respond(event.target, RESPONSES.SEEDER_REMOVE, { status: 'ok' })
        })
      break
    case REQUESTS.SEEDER_LIST:
      seeder.list()
        .then(urls => {
          respond(event.target, RESPONSES.SEEDER_LIST, { urls })
        })
      break
    default:
      break
  }
}

/**
 * @typedef {ConstructorParameters<typeof import('hyperdht')>[0]} DHTOpts
 */
