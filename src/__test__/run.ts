import cli from 'cli-ux'
import * as nock from 'nock'
import * as path from 'path'

import { run as runCLI } from '../cli'

const debug = require('debug')

const root = path.join(__dirname, '../../example')
const { version } = require(path.join(root, 'package.json'))

export async function run(argv: string[] = []) {
  // mock some things
  nock('https://cli-assets.heroku.com:443')
    .get('/cli-engine-example/channels/stable/version')
    .reply(200, { channel: 'stable', version })
  cli.config.mock = true

  // run CLI
  await runCLI(['node', 'run', ...argv], { root })

  // show debug output
  const d = debug(`test:${argv[0]}`)
  const stdout = cli.stdout.output
  const stderr = cli.stderr.output
  if (stdout) d(`stdout: ${stdout}`)
  if (stderr) d(`stdout: ${stderr}`)

  return { stdout, stderr }
}
