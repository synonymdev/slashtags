import { expect } from 'aegir/utils/chai.js'
import { HOOKS } from '../src/constants.js'
import { errors } from '../src/errors.js'
import slashtags, { SlashtagsError } from '../src/index.js'

describe('Events', () => {
  it('should await all event listeners', async () => {
    const slash = slashtags()

    /** @type {string[]} */
    const result = []

    slash.on('foo', () => result.push('foo-1'))
    slash.on(
      'foo',
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            result.push('foo-2')
            resolve('')
          }, 10)
        )
    )
    slash.on('foo', async function (...args) {
      result.push('foo-3')
      // @ts-ignore
      result.push([this, ...args])
    })

    expect(result).to.be.empty()
    await slash.emit('foo', 'bar')
    expect(result).to.eql(['foo-1', 'foo-2', 'foo-3', [slash, 'bar']])
  })

  it('should ignore listeners inside listeners', async () => {
    const slash = slashtags()

    /** @type {string[]} */
    const result = []

    slash.on('foo', async () => {
      result.push('foo-1')
      slash.on('foo', async () => {
        result.push('foo-2')
      })
    })

    expect(result).to.be.empty()
    await slash.emit('foo')

    expect(result).to.eql(['foo-1'])
  })

  it('should throw an error for emitting a protected hook', async () => {
    let err

    try {
      await slashtags().use(a)
    } catch (error) {
      err = error
    }

    expect(err).to.be.instanceOf(SlashtagsError)
    expect(err.message).to.equal(
      errors.SLASH_ERR_PROTECTED_HOOK('onReady').message
    )

    /** @type {import('../src/interfaces').Plugin} */
    async function a (slash, options) {
      await slash.emit(HOOKS.OnReady)
    }
  })
})
