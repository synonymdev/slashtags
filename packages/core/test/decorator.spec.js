import { expect } from 'aegir/utils/chai.js'
import { errors } from '../src/errors.js'
import slashtags from '../src/index.js'
import { pluginA } from './test-plugin/a/index.js'

describe('Decorate', () => {
  it('should decorate slashtags instance', async () => {
    const slash = slashtags()
    slash.decorate('fooA', 'bar')
    slash.decorate('makeFoo', () => 'made bar')

    expect(slash.fooA).to.equal('bar')
    expect(slash.makeFoo()).to.equal('made bar')
  })

  it('should decorate slashtags instance from within a plugin', async () => {
    const slash = await slashtags().use(pluginA, { fooA: 'bar' }).ready()

    expect(slash.fooA).to.equal('bar')
    expect(slash.makeFoo()).to.equal('made bar')
  })

  it('should throw an error if decorator already exists', async () => {
    const slash = await slashtags().use(plugin).ready()

    expect(slash.fooA).to.equal('bar')

    /** @type {import('../src/interfaces.js').Plugin} */
    async function plugin (slash, options) {
      slash.decorate('fooA', 'bar')

      expect(() => slash.decorate('fooA', 'bar')).to.throw(
        errors.SLASH_ERR_DEC_ALREADY_PRESENT('fooA').message
      )
    }
  })

  it('should throw an error for trying to override a builtin property', async () => {
    const slash = await slashtags().use(plugin).ready()

    expect(slash.fooA).to.equal('bar')

    /** @type {import('../src/interfaces.js').Plugin} */
    async function plugin (slash, options) {
      slash.decorate('fooA', 'bar')

      expect(() => slash.decorate('_events', 'bar')).to.throw(
        errors.SLASH_ERR_DEC_BUILTIN_PROPERTY('_events').message
      )

      expect(() => slash.decorate('on', 'bar')).to.throw(
        errors.SLASH_ERR_DEC_BUILTIN_PROPERTY('on').message
      )
    }
  })
})
