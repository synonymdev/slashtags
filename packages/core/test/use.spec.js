import { expect } from 'aegir/utils/chai.js'
import { errors, SlashtagsError, warnings } from '../src/errors.js'
import slashtags from '../src/index.js'
import { pluginA } from './test-plugin/a/index.js'
import { pluginB } from './test-plugin/b/index.js'

describe('Use', () => {
  it('should install a plugin', async () => {
    const slash = await slashtags().use(pluginA, { fooA: 'bar' }).ready()

    expect(slash.fooA).to.equal('bar')
  })

  it('should chain installing  plugins', async () => {
    const slash = await slashtags()
      .use(pluginA, { fooA: 'barA' })
      .use(pluginB, { fooB: 'barB' })
      .ready()

    expect(slash.fooA).to.equal('barA')
    expect(slash.fooB).to.equal('barB')
  })

  it('should install plugins from inside other plugins', async () => {
    const slash = await slashtags().use(b, { foo: 'barB' }).ready()

    async function a (instance, options) {
      Object.assign(instance, { fooA: 'barA' })
    }

    /** @type {import ('../src/interfaces').Plugin<{foo: string}>} */
    async function b (slash, options) {
      await slash.use(a)
      slash.decorate('fooB', options.foo)
    }

    expect(slash.fooA).to.equal('barA')
    expect(slash.fooB).to.equal('barB')
  })

  it('should awaits installing plugins before continuing', async () => {
    const slash = await slashtags().use(b, { foo: 'barB' }).ready()

    /** @type {import('../src/interfaces').Plugin<{foo: string}>} */
    async function a (slash, options) {
      return new Promise((resolve) => {
        setTimeout(() => {
          slash.decorate('fooA', 'barA')
          resolve()
        }, 100)
      })
    }

    /** @type {import ('../src/interfaces').Plugin<{foo: string}>} */
    async function b (slash, options) {
      expect(slash.fooA).to.be.undefined()
      await slash.use(a)
      expect(slash.fooA).to.equal('barA')
      slash.decorate('fooB', options.foo)
    }

    expect(slash.fooA).to.equal('barA')
    expect(slash.fooB).to.equal('barB')
  })

  it('should throw an error for trying to install a plugin after ready', async () => {
    const slash = await slashtags().ready()

    const plugin = async function (instance, options) {}

    let err
    try {
      slash.use(plugin)
    } catch (error) {
      err = error
    }

    expect(err).to.be.instanceOf(SlashtagsError)
    expect(err.message).to.equal(
      errors.SLASH_ERR_ALREADY_LOADED(plugin).message
    )
  })

  it('should deduplicate plugins', async () => {
    let counter = 0
    await slashtags().use(a).use(b).ready()

    async function a (slash) {
      await slash.use(b)
    }

    async function b () {
      counter++
    }

    expect(counter).to.equal(1)
  })

  it('should throw a warning if the plugin was installed with different options', async () => {
    let counter = 0

    const log = []

    await slashtags({
      logger: {
        ...console,
        warn: (w) => {
          log.push(w)
        }
      }
    })
      .use(a, { foo: 'bar' })
      .use(b, { foo: 'zar' })
      .ready()

    async function a (slash, options) {
      await slash.use(b, options)
    }

    async function b (slash, options) {
      counter++
    }

    expect(counter).to.equal(1)
    expect(log).to.have.lengthOf(1)
    expect(log[0].message).to.equal(
      warnings.SLASH_WARN_ALREADY_INSTALLED_WITH_DIFFERENT_OPTIONS(b, {
        foo: 'bar'
      }).message
    )
    expect(log[0].data.foo).to.equal('bar')
  })
})
