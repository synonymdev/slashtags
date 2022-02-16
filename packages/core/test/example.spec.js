import { expect } from 'aegir/utils/chai.js'
import slashtags from '../src/index.js'

describe('Example', () => {
  it('should load plugins in the right order', async () => {
    const logs = []
    const logger = { ...console, log: (...args) => logs.push(...args) }

    const slash = await slashtags({ logger })
      .use(first, { foo: 1 })
      .use(third, { foo: 3 })
      .ready()

    expect(logs).to.eql([
      'first loaded',
      'second loaded',
      'third loaded',
      'after all'
    ])
    expect(slash.first).to.equal(1)
    expect(slash.second).to.equal(2)
    expect(slash.third).to.equal(3)

    await slash.close()

    expect(logs[4]).to.equal('after close')

    async function first (slash, options) {
      slash.logger.log('first loaded')
      slash.use(second, { foo: 2 })
      slash.decorate('first', options.foo)
      slash.onReady(afterReady.bind(slash))
      slash.onClose(afterClose.bind(slash))
    }

    async function second (slash, options) {
      slash.logger.log('second loaded')
      slash.decorate('second', options.foo)
    }

    async function third (slash, options) {
      slash.logger.log('third loaded')
      slash.decorate('third', options.foo)
    }

    async function afterReady (slash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.logger.log('after all')
          resolve()
        }, 10)
      })
    }

    async function afterClose (slash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.logger.log('after close')
          resolve()
        }, 10)
      })
    }
  })
})
