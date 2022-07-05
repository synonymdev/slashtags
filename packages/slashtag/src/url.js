import z32 from 'z32'

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
      input = 'https://' + z32.encode(input)
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
      key: z32.decode(this.hostname)
    }
  }
}
