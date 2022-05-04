import b32 from 'hi-base32'
import b4a from 'b4a'

const DEFAULT_PROTOCOL = 'slash'

/**
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
function fromBase32 (str) {
  return b4a.from(b32.decode.asBytes(str.toUpperCase()))
}

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
      input = 'https://' + toBase32(input)
    }

    // @ts-ignore
    super(input, base)

    this._protocol = _protocol || DEFAULT_PROTOCOL
  }

  get protocol () {
    return this._protocol
  }

  toString () {
    return super.toString().replace('https', this.protocol)
  }

  /**
   * The slashtag part of the url
   */
  get slashtag () {
    return {
      base32: this.hostname,
      key: fromBase32(this.hostname)
    }
  }
}

/**
 *
 * @param {Uint8Array} buf
 */
function toBase32 (buf) {
  return b32.encode(b4a.from(buf)).replace(/[=]/g, '').toLowerCase()
}
