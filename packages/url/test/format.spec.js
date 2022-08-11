import { expect } from 'aegir/chai'
import b4a from 'b4a'
import * as SlashURL from '../src/index.js'

describe('format', () => {
  it('should format a key with defaults', () => {
    const key = b4a.from(
      'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
      'hex'
    )
    const url = SlashURL.format(key)

    expect(url).to.equal(
      'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy'
    )
  })

  it('should throw an error for invalid key', () => {
    expect(() => SlashURL.format('foo')).to.throw('Key must be a Buffer')
    expect(() =>
      SlashURL.format(b4a.from('cce18ed41101509ab171a0a9b54aaf67a', 'hex'))
    ).to.throw('Key must be 32-bytes long')
  })

  it('should format optional parts of the url', () => {
    const key = b4a.from(
      'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
      'hex'
    )

    expect(
      SlashURL.format(key, {
        protocol: 'slashfoo',
        query: 'foo',
        fragment: 'fava'
      })
    ).to.equal(
      'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo#fava'
    )

    expect(
      SlashURL.format(key, {
        protocol: 'slashfoo',
        path: 'dir/file.json',
        query: { foo: 'bar' },
        fragment: { foo: 'zar' }
      })
    ).to.equal(
      'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/dir/file.json?foo=bar#foo=zar'
    )
  })
})
