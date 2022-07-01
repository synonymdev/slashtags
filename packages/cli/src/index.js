#! /usr/bin/env node
import { Argument, Command } from 'commander'
import { version } from './utils.js'
import { daemon } from './daemon/index.js'

const program = new Command('slash')

program
  .description('Command line interface for Slashtags')
  .version(version, '-v, --version')

program
  .command('daemon')
  .addArgument(
    new Argument('start/stop/status').choices(['start', 'status', 'stop'])
  )
  .usage('<start/stop/status>' + daemon.usage)
  .summary(daemon.summary)
  .description(daemon.description)
  .action(daemon)

const commands = [daemon]

program.addHelpText(
  'after',
  `
${commands.map(
  (c) => `
${c.name.slice(0, 1).toUpperCase() + c.name.slice(1)} commands:${c.usage}`
)}`
)

program.showHelpAfterError()
program.showSuggestionAfterError()

program.parse(process.argv)
