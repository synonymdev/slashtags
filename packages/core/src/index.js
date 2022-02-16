import EventEmitter from 'events'
import { errors, warnings, SlashtagsError } from './errors.js'
import { HOOKS } from './constants.js'
export { SlashtagsError, errors, warnings, HOOKS }
export class Slashtags extends EventEmitter {
  /** @param {import('./interfaces').SlashtagsOptions} [options] */
  constructor (options) {
    super()

    this.logger = options?.logger || console

    this._setup = {
      /** @type {Array<Promise<void>>} */
      queue: [],
      decorators: new Set(),
      plugins: new Map(),
      currentPlugin: null
    }
  }

  get status () {
    return {
      loaded: !this._setup
    }
  }

  // Extends EventEmitter
  // @ts-ignore
  emit (type, ...args) {
    if (Object.values(HOOKS).includes(type)) {
      throw errors.SLASH_ERR_PROTECTED_HOOK(type)
    }

    return _emit.call(this, type, ...args)
  }

  // Plugin method
  /**
   * @type {<O extends Record<string, any> = {}>(plugin:import('./interfaces').Plugin<O>, options: O)=> PromiseLike<void> & Slashtags}
   */
  // @ts-ignore
  use (plugin, options = {}) {
    if (this.status.loaded) {
      throw errors.SLASH_ERR_ALREADY_LOADED(plugin)
    } else if (this._setup.plugins.has(plugin)) {
      if (
        JSON.stringify(this._setup.plugins.get(plugin)) !==
        JSON.stringify(options)
      ) {
        this.logger.warn(
          warnings.SLASH_WARN_ALREADY_INSTALLED_WITH_DIFFERENT_OPTIONS(
            plugin,
            this._setup.plugins.get(plugin)
          )
        )
      }
      // @ts-ignore
      return this
    }

    const promise = plugin(this, options)
    this._setup.queue.push(promise)

    Object.assign(this, {
      then: promise.then.bind(promise)
    })

    this._setup.plugins.set(plugin, options)
    // @ts-ignore
    return this
  }

  /**
   *
   * @param {string} name
   * @param {any} value
   */
  decorate (name, value) {
    if (this._setup.decorators.has(name)) {
      throw errors.SLASH_ERR_DEC_ALREADY_PRESENT(name)
    } else if (
      // @ts-ignore
      this[name] !== undefined
    ) {
      throw errors.SLASH_ERR_DEC_BUILTIN_PROPERTY(name)
    }

    this._setup.decorators.add(name)
    // @ts-ignore
    this[name] = value
  }

  // Life cycle hooks
  /**
   *
   * @returns {Promise<Slashtags>}
   */
  async ready () {
    if (this.status.loaded) return this

    // @ts-ignore
    delete this.then

    await Promise.all(this._setup.queue)
    await _emit.call(this, HOOKS.OnReady)

    // @ts-ignore
    delete this._setup
    return this
  }

  async close () {
    await _emit.call(this, HOOKS.OnClose)
    return this
  }

  // Hooks
  /** @param {Parameters<EventEmitter['on']>[1]} cb */
  onReady (cb) {
    return this.on(HOOKS.OnReady, cb)
  }

  /** @param {Parameters<EventEmitter['on']>[1]} cb */
  onClose (cb) {
    return this.on(HOOKS.OnClose, cb)
  }
}

/**
 *
 * @param {string} type
 * @param  {...any} args
 * @returns
 */
async function _emit (type, ...args) {
  // @ts-ignore
  let handlers = this._events[type]
  if (handlers === undefined) return false

  if (typeof handlers === 'function') handlers = [handlers]

  for (const handler of handlers) {
    // @ts-ignore
    await handler.bind(this)(...args)
  }

  return true
}

/** @type {(options?: SlashtagsOptions) => Slashtags} */
export const slashtags = (options) => new Slashtags(options)

export default slashtags

/** @typedef {import('./interfaces').SlashtagsOptions} SlashtagsOptions */
