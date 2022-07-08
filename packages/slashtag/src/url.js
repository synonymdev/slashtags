import z32 from 'z32'
import b4a from 'b4a'
import { fletcher16 } from './utils.js'

const DEFAULT_PROTOCOL = 'slash'

export class SlashURL extends URL {
  /**
   *
   * @param {string | Uint8Array} input
   * @param {string | SlashURL} [base]
   */
  constructor (input, base) {
    let _protocol

    if (typeof input === 'string') {
      const [protocol] = input.split(':')
      _protocol = protocol
      input = input.replace(_protocol, 'https')
    } else {
      const checksummed = b4a.concat([input, fletcher16(input)])
      input = 'https://' + z32.encode(checksummed)
    }

    // @ts-ignore
    super(input, base)

    this._protocol = _protocol || DEFAULT_PROTOCOL
    validate(this)
  }

  get protocol () {
    return this._protocol
  }

  get href () {
    return this.toString()
  }

  get origin () {
    return this._protocol + '://' + this.hostname
  }

  toString () {
    return super.toString().replace('https', this.protocol)
  }

  /**
   * The slashtag part of the url
   */
  get slashtag () {
    this._checksummedKey = this._checksummedKey || z32.decode(this.hostname)

    return {
      toString: () => this.hostname,
      base32: this.hostname,
      key: this._checksummedKey.subarray(0, 32),
      checksum: this._checksummedKey.subarray(32)
    }
  }
}

/**
 *
 * @param {SlashURL} url
 */
function validate (url) {
  if (!url._protocol.startsWith('slash')) {
    throw new Error(
      `Invalid URL: SlashURL should start with "slash", got: "${url._protocol}"`
    )
  }

  const base32 = url.hostname

  if (base32.length !== 55) {
    throw new Error(
      'Invalid URL: slashtag key should have length of 55, got: ' +
        base32.length
    )
  }

  const expectedChecksum = fletcher16(url.slashtag.key)

  if (!b4a.equals(url.slashtag.checksum, expectedChecksum)) {
    throw new Error('Invalid URL: wrong checksum')
  }
}
