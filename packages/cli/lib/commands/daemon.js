import pm2 from 'pm2'
import path from 'path'
import chalk from 'chalk'
import WebSocket from 'ws'

import { ROOT_DIR, DEFAULT_PORT } from '../constants.js'
import { retry } from '../utils.js'

const PROCESS_NAME = 'slashtags-daemon'

const ADDRESS = 'ws://localhost:' + DEFAULT_PORT
const RUNNING = `Daemon ${chalk.green(
  'is running'
)} and listening on ${chalk.green(ADDRESS)}\n`
export const NOT_RUNNING = `Daemon is ${chalk.red('NOT running')}.\n`

/** @param {string} type */
export const daemon = type => {
  switch (type) {
    case 'start':
      start()
      break
    case 'stop':
      stop()
      break
    case 'status':
      status()
      break
    default:
      break
  }
}

daemon.usage = `

  slash daemon status - Check the status of the Slashtags daemon.
  slash daemon start  - Start running the Slashtags daemon.
  slash daemon stop   - Stop running the Slashtags daemon.
`

daemon.description = 'Start, stop, or check the status of the daemon'

daemon.summary = 'daemon commands'

async function start () {
  const running = await check()
  running
    ? console.log(RUNNING)
    : pm2.start(
      {
        name: PROCESS_NAME,
        script: path.join(ROOT_DIR, './lib/daemon/index.js')
      },
      async err => {
        err && console.error(err)
        console.log('starting...')

        await retry(check, 1000)

        status()
        return pm2.disconnect()
      }
    )
}

async function stop () {
  const running = await check()
  if (!running) {
    console.log(NOT_RUNNING)
    return
  }
  console.log('closing daemon...')
  pm2.delete(PROCESS_NAME, async err => {
    err && err.message !== 'process or namespace not found'
      ? console.error(err)
      : await status()
    return pm2.disconnect()
  })
}

async function status () {
  const running = await check()
  running ? console.log(RUNNING) : console.log(NOT_RUNNING)
}

function check () {
  return new Promise(resolve => {
    const socket = new WebSocket(ADDRESS)
    socket.on('error', () => resolve(false))
    socket.on('open', () => {
      socket.close()
      resolve(true)
    })
  })
}

export default daemon
