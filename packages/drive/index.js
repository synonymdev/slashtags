class Drivestore {
  /**
   * @param {import('@synonymdev/slashtags-core-data')} coreData
   */
  constructor (coreData) {
    this._coreData = coreData
    this.corestore = this._coreData._corestoreSession
  }

  /**
   * @deprecated
   */
  [Symbol.asyncIterator] () {
    return new Error('not supported')
  }

  get closed () {
    return this.corestore._root.closing
  }

  ready () {
    return this._coreData.ready()
  }

  /** @param {Parameters<import('corestore')['replicate']>} args */
  replicate (...args) {
    return this.corestore.replicate(...args)
  }

  /**
   * Get a Hyperdrive by its name.
   */
  get (name = 'public') {
    return this._coreData._getLocalDrive(name)
  }
}

module.exports = Drivestore
