// @flow

import type {Config} from 'cli-engine-config'
import path from 'path'

const debug = require('debug')('cli-engine:hooks')

export default class Hooks {
  config: Config

  constructor ({config}: {config: Config}) {
    this.config = config
  }

  async run (event: string, options: Object = {}) {
    options = {
      config: this.config,
      ...options
    }
    let scripts = this.config.hooks[event]
    if (!scripts) return
    for (let script of scripts) {
      script = path.join(this.config.root, script)
      debug(`%s %s`, event, script)
      const m = require(script)
      await m(options)
    }
  }
}
