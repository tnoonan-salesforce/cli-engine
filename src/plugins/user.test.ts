import * as execa from 'execa'
import * as nock from 'nock'
import * as path from 'path'

import { run, skipIfNode6 } from '../__test__/run'
import Config from '../config'
import * as fs from '../file'

let api = nock('https://status.heroku.com:443')

beforeEach(() => nock.cleanAll())
afterEach(() => api.done())

jest.setTimeout(120000)

test('installs heroku-cli-status', async () => {
  // uninstall plugin if needed
  await run(['plugins:uninstall', 'heroku-cli-status']).catch(() => {})

  // ensure plugin is gone
  expect((await run(['plugins'])).stdout).not.toContain('heroku-cli-status')

  // install plugin
  await run(['plugins:install', 'heroku-cli-status'])

  // check for plugin
  expect((await run(['plugins'])).stdout).toContain('heroku-cli-status')

  // get plugin's help
  expect((await run(['help'])).stdout).toMatch(/status.*status of the Heroku platform/)
  expect((await run(['help', 'status'])).stdout).toContain('display current status of the Heroku platform')

  // run plugin
  api.get('/api/v4/current-status').reply(200, {
    status: [
      { system: 'Apps', status: 'green' },
      { system: 'Data', status: 'green' },
      { system: 'Tools', status: 'green' },
    ],
    incidents: [],
    scheduled: [],
  })
  expect((await run(['status'])).stdout).toMatch(/Apps: +No known issues at this time./)

  // uninstall plugin
  await run(['plugins:uninstall', 'heroku-cli-status'])

  // ensure plugin is gone
  expect((await run(['plugins'])).stdout).not.toContain('heroku-cli-status')

  // ensure plugin help is gone
  expect((await run(['help'])).stdout).not.toContain('status')
  await expect(run(['help', 'status'])).rejects.toThrow(/Exited with code: 127/)
})

describe('migrate', () => {
  skipIfNode6('migrates heroku-apps and heroku-cli-plugin-generator', async () => {
    const config = new Config()
    const legacyPath = path.join(config.dataDir, 'plugins/package.json')
    await fs.outputJSON(legacyPath, {
      private: true,
      dependencies: { 'heroku-cli-plugin-generator': 'latest', 'heroku-apps': 'latest' },
    })
    expect((await run(['help', 'config:get'])).stdout).toMatch(/Usage: cli-engine config:get KEY \[flags\]/)
    expect((await run(['help', 'plugins:generate'])).stdout).toMatch(/Usage: cli-engine plugins:generate NAME/)
  })
})

describe('update', () => {
  skipIfNode6('update heroku-cli-status', async () => {
    const config = new Config()
    await run(['plugins:install', 'heroku-cli-status'])
    expect((await run(['plugins'])).stdout).not.toMatch(/heroku-cli-status 4.0.6/)
    await execa('yarn', ['add', 'heroku-cli-status@4'], { cwd: path.join(config.dataDir, 'plugins') })
    expect((await run(['plugins'])).stdout).toMatch(/heroku-cli-status 4.0.6/)
    await run(['plugins:update'])
    expect((await run(['plugins'])).stdout).not.toMatch(/heroku-cli-status 4.0.6/)
  })
})
