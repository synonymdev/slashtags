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
      'brbk62w3uwenygs77rx4xxmekzhyxubch4x4ts4gpi67mlhmboga'
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
      'brbk62w3uwenygs77rx4xxmekzhyxubch4x4ts4gpi67mlhmboga'
    )
    expect(url.slashtag.key).to.eql(key)
  })
})
