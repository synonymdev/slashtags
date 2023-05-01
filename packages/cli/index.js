#! /usr/bin/env node
const { Argument, Command } = require('commander')
const { VERSION } = require('./lib/constants.js')
const daemon = require('./lib/commands/daemon.js')
const seeder = require('./lib/commands/seeder.js')

const program = new Command('slash')

program
  .description('Command line interface for Slashtags')
  .version(VERSION, '-v, --version')

program
  .command('daemon')
  .addArgument(
    new Argument('start/stop/status').choices(['start', 'status', 'stop'])
  )
  .usage('<start/stop/status>' + daemon.usage)
  .summary(daemon.summary)
  .description(daemon.description)
  .action(daemon)

program
  .command('seeder')
  .addArgument(
    new Argument('add/remove/list').choices(['add', 'remove', 'list'])
  )
  .usage('<add/remove/list>' + seeder.usage)
  .summary(seeder.summary)
  .description(seeder.description)
  .action(seeder)

const commands = [daemon, seeder]

program.addHelpText(
  'after',
  `${commands.map(c => `\n\n  ${c.name.slice(0, 1).toUpperCase() + c.name.slice(1)} commands:${c.usage}`)}`
    .replace(',', '')
)

program.showHelpAfterError()
program.showSuggestionAfterError()

program.parse(process.argv)
