if (process.env.HEROKU_TIME_REQUIRE) require('time-require')

const path = require('path')
const dirs = require('./lib/dirs')
const findConfig = require('find-config')
if (module.parent) dirs.cliRoot = path.dirname(findConfig('package.json', {dir: path.dirname(module.parent.filename)}))
const config = require('./lib/config')
const version = config.version
const plugins = require('./lib/plugins')
let argv = process.argv.slice(2)
argv.unshift('heroku')

function onexit (options) {
  const ansi = require('ansi-escapes')
  process.stderr.write(ansi.cursorShow)
  if (options.exit) process.exit(1)
}

process.on('exit', onexit)
process.on('SIGINT', onexit.bind(null, {exit: true}))

async function main () {
  let command
  try {
    const Update = require('./commands/update')
    const update = new Update({version})
    await update.checkIfUpdating()
    let Command
    command = plugins.commands[argv[1] || 'dashboard']
    if (command) Command = command.fetch()
    if (!command) Command = require('./commands/no_command')
    if (!Command._version) {
      // v5 command
      const {convertLegacy} = require('heroku-cli-command')
      Command = convertLegacy(Command)
    }
    command = new Command({argv, version})
    await command.init()
    await command.run()
    await command.done()
    process.exit(0)
  } catch (err) {
    if (command && command.error) command.error(err)
    else console.error(err)
    process.exit(1)
  }
}

module.exports = main()
