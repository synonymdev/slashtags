import b4a from 'b4a'

import { expect } from 'aegir/chai'
import { SlashURL } from '../src/url.js'

describe('SlashURL', () => {
  it('should create a slash url object from a slashtag key', () => {
    const key = b4a.from(
      '0c42af6adba588dc1a5ffc6fcbdd84564f8bd0223f2fc9cb867a3df62cec0b8c',
      'hex'
    )
    const url = new SlashURL(key)

    expect(url.toString()).to.startWith('slash://')
    expect(url.protocol).to.equal('slash')
    expect(url.slashtag.base32).to.eql(
      'btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmghe'
    )
    expect(url.slashtag.key).to.eql(key)
  })

  it('should create a slash url object from a url string', () => {
    const key = b4a.from(
      '0c42af6adba588dc1a5ffc6fcbdd84564f8bd0223f2fc9cb867a3df62cec0b8c',
      'hex'
    )

    const url = new SlashURL(
      new SlashURL(key).toString().replace('slash://', 'slashauth://')
    )

    expect(url.toString()).to.startWith('slashauth://')
    expect(url.protocol).to.equal('slashauth')
    expect(url.slashtag.base32).to.eql(
      'btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmghe'
    )
    expect(url.slashtag.key).to.eql(key)
  })

  it('should throw an error for wrong slashtag key length', () => {
    expect(
      () =>
        new SlashURL(
          'slash://btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmghex'
        )
    ).to.throw('Invalid URL: slashtag key should have length of 55, got: 56')

    expect(
      () =>
        new SlashURL(
          'slash://btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmgh'
        )
    ).to.throw('Invalid URL: slashtag key should have length of 55, got: 54')
  })

  it('should throw an error for invalid checksum', () => {
    expect(
      () =>
        new SlashURL(
          'slash://btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmghf'
        )
    ).to.throw('Invalid URL: wrong checksum')
  })

  it('should throw an error for wrong protocol', () => {
    expect(
      () =>
        new SlashURL(
          'slas://btbk64s5wsrpag199tzhzzcrk38azwbn8hzhu1hgxe69cm8cbqgmghf'
        )
    ).to.throw('Invalid URL: SlashURL should start with "slash", got: "slas"')
  })
})
