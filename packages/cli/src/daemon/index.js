import pm2 from 'pm2'
import path from 'path'
import chalk from 'chalk'

import { rootDir, DEFAULT_PORT } from '../constants.js'

const PROCESS_NAME = 'slashtags-daemon'

/**
 *
 * @param {string} type
 */
export const daemon = (type) => {
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

daemon.description = `Start, stop, or check the status of the daemon
  daemon will run on ws://localhost:${DEFAULT_PORT}`

daemon.summary = 'daemon commands'

async function start () {
  pm2.start(
    {
      name: PROCESS_NAME,
      script: path.join(rootDir, './src/daemon/start.js')
    },
    (err, app) => {
      if (err) {
        console.error(err)
        return pm2.disconnect()
      }

      console.log(`Daemon is ${chalk.green('running')}.`, '\n')
      return pm2.disconnect()
    }
  )
}

async function stop () {
  pm2.delete(PROCESS_NAME, (err, app) => {
    if (err) {
      if (err.message !== 'process or namespace not found') {
        console.error(err)
      }
    }

    console.log(`Daemon is ${chalk.red('NOT running')}.`, '\n')
    return pm2.disconnect()
  })
}

function status () {
  pm2.list((err, list) => {
    if (err) {
      console.error(err)
      return pm2.disconnect()
    }

    const p = list.filter((p) => p.name === PROCESS_NAME)[0]

    const status = p?.pm2_env?.status

    if (status) {
      console.log(
        `Daemon is ${status === 'online' ? chalk.green('running') : status}.\n`
      )
    } else {
      console.log(`Daemon is ${chalk.red('NOT running')}.`, '\n')
    }

    pm2.disconnect()
  })
}
