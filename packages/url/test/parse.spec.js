import { expect } from 'aegir/chai'
import b4a from 'b4a'
import safe from 'safe-regex2'

import * as SlashURL from '../src/index.js'

const baseResult = {
  fragment: '',
  key: 'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
  path: '',
  privateQuery: {},
  protocol: 'slash:',
  query: {}
}

const testVectors = [
  {
    // Basic
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy',
    result: baseResult
  },
  {
    // Not checksummed + different protocol
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhn',
    result: baseResult
  },
  {
    // Trailing slash
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/',
    result: {
      ...baseResult,
      path: '/'
    }
  },
  {
    // Basic query
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo=bar',
    result: {
      ...baseResult,
      query: { foo: 'bar' }
    }
  },
  {
    // Multiple queries and trailing slash
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/?foo=bar&bool&no=42',
    result: {
      ...baseResult,
      path: '/',
      query: { foo: 'bar', bool: true, no: '42' }
    }
  },
  {
    // Fragment
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy#bool&foo=bar',
    result: {
      ...baseResult,
      fragment: '#bool&foo=bar',
      privateQuery: { foo: 'bar', bool: true }
    }
  },
  {
    // Path + query + fragment
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/dir/file.json?foo=bar&bool&no=42#bool&foo=bar',
    result: {
      ...baseResult,
      path: '/dir/file.json',
      query: { foo: 'bar', bool: true, no: '42' },
      fragment: '#bool&foo=bar',
      privateQuery: { foo: 'bar', bool: true }
    }
  },
  {
    // Path + trailing slash + query + fragment
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/first/second/?foo=bar&bool&no=42#bool&foo=bar',
    result: {
      ...baseResult,
      path: '/first/second/',
      query: { foo: 'bar', bool: true, no: '42' },
      fragment: '#bool&foo=bar',
      privateQuery: { foo: 'bar', bool: true }
    }
  },
  {
    // different protocol
    url: 'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy',
    result: {
      ...baseResult,
      protocol: 'slashfoo:'
    }
  },
  {
    // one missing character
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswh',
    result: baseResult
  }
]

describe('parse', () => {
  it('should have a safe parsing pattern', () => {
    expect(safe(SlashURL.PATTERN)).to.be.true()
  })

  it('should throw an error for non string urls', () => {
    expect(() => SlashURL.parse(32)).to.throw('url must be a string')
  })

  it('should throw an error for non invalid protocol', () => {
    expect(() => SlashURL.parse('not-slash://')).to.throw(
      'url must starts with a "slash[...]:" protocol'
    )
  })

  it('should throw an error for non invalid key length', () => {
    expect(() =>
      SlashURL.parse(
        'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39usw'
      )
    ).to.throw('Invalid key bytelength')
  })

  testVectors.forEach((vector) => {
    it('should parse a url: ' + vector.url, () => {
      const parsed = SlashURL.parse(vector.url)

      expect(parsed.key).to.eql(b4a.from(vector.result.key, 'hex'))
      expect(parsed.protocol).to.eql(vector.result.protocol)
      expect(parsed.path).to.eql(vector.result.path)
      expect(parsed.query).to.eql(vector.result.query)
      expect(parsed.fragment).to.eql(vector.result.fragment)
      expect(parsed.privateQuery).to.eql(vector.result.privateQuery)
    })
  })
})
