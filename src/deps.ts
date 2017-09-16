import commandManager = require('./command_managers')
import help = require('./commands/help')
import hooks = require('./hooks')
import lock = require('./lock')
import notFound = require('./not_found')
import plugins = require('./plugins')
import updater = require('./updater')
import util = require('./util')

import Moment = require('moment')
import CLICommandHelp = require('cli-engine-command/lib/help')

import HTTP = require('http-call')

export const deps = {
  // local
  get CommandManager(): typeof commandManager.CommandManager { return fetch('./command_managers').CommandManager },
  get Help(): typeof help.default { return fetch('./commands/help').default },
  get Hooks(): typeof hooks.Hooks { return fetch('./hooks').Hooks },
  get Lock(): typeof lock.Lock { return fetch('./lock').Lock },
  get NotFound(): typeof notFound.default { return fetch('./not_found').default },
  get Plugins(): typeof plugins.Plugins { return fetch('./plugins').Plugins },
  get Updater(): typeof updater.Updater { return fetch('./updater').Updater },
  get util(): typeof util { return fetch('./util') },

  // remote
  get RWLockFile(): any { return fetch('rwlockfile') },
  get HTTP(): typeof HTTP.HTTP { return fetch('http-call').HTTP },
  get moment(): typeof Moment { return fetch('moment') },
  get CLICommandHelp (): typeof CLICommandHelp.Help { return require('cli-engine-command/lib/help').Help },
}

const cache: any = {}

function fetch(s: string) {
  if (!cache[s]) {
    cache[s] = require(s)
  }
  return cache[s]
}
