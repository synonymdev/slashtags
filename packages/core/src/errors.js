export class SlashtagsError extends Error {
  /**
   *
   * @param {string} code
   * @param {string} message
   * @param {object} [data]
   */
  constructor (code, message, data) {
    super(message)
    this.name = 'SlashtagsError'
    this.code = code.toUpperCase().replace(/\s/g, '_')
    this.data = data
  }
}

export const errors = {
  /** @param {string | symbol} name */
  SLASH_ERR_DEC_ALREADY_PRESENT: (name) =>
    new SlashtagsError(
      'SLASH_ERR_DEC_ALREADY_PRESENT',
      `The decorator '${name.toString()}' has already been added!`,
      { name }
    ),
  /** @param {string | symbol} name */
  SLASH_ERR_DEC_BUILTIN_PROPERTY: (name) =>
    new SlashtagsError(
      'SLASH_ERR_DEC_BUILTIN_PROPERTY',
      `Decorators cannot override built-in property '${name.toString()}'!`
    ),
  /** @param {string | symbol} type */
  SLASH_ERR_PROTECTED_HOOK: (type) =>
    new SlashtagsError(
      'SLASH_ERR_PROTECTED_HOOK',
      `Event type '${type.toString()}' is a protected hook!`,
      { type }
    ),
  /** @param {any} plugin */
  SLASH_ERR_ALREADY_LOADED: (plugin) =>
    new SlashtagsError(
      'SLASH_ERR_ALREADY_LOADED',
      `Can't install plugin '${plugin.name}', slashtags has already been loaded!`,
      { plugin }
    )
}

export const warnings = {
  /**
   * @param {any} plugin
   * @param {any} installedOpts
   */
  SLASH_WARN_ALREADY_INSTALLED_WITH_DIFFERENT_OPTIONS: (
    plugin,
    installedOpts
  ) =>
    new SlashtagsError(
      'SLASH_WARN_ALREADY_INSTALLED_WITH_DIFFERENT_OPTIONS',
      `Plugin '${plugin.name}' has already been installed with different options!`,
      installedOpts
    )
}
