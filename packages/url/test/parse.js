import b4a from 'b4a'
import safe from 'safe-regex2'
import test from 'brittle'

import * as SlashURL from '../index.js'

const baseResult = {
  id: '3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy',
  fragment: '',
  key: 'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
  path: '',
  privateQuery: {},
  protocol: 'slash:',
  query: {}
}

test('should have a safe parsing pattern', (t) => {
  t.ok(safe(SlashURL.PATTERN))
})

test('should throw an error for non string urls', (t) => {
  t.exception(() => SlashURL.parse(32), 'url must be a string')
})

test('should throw an error for non invalid protocol', (t) => {
  t.exception(
    () => SlashURL.parse('not-slash://'),
    'url must starts with a "slash[...]:" protocol'
  )
})

test('should throw an error for non invalid key length', (t) => {
  t.exception(
    () =>
      SlashURL.parse(
        'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39usw'
      ),
    'Invalid key bytelength'
  )
})

const testVectors = [
  {
    desc: 'Basic',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy',
    result: baseResult
  },
  {
    desc: 'Not checksummed + different protocol',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhn',
    result: baseResult
  },
  {
    desc: 'Trailing slash',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/',
    result: {
      ...baseResult,
      path: '/'
    }
  },
  {
    desc: 'Basic query',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo=bar',
    result: {
      ...baseResult,
      query: { foo: 'bar' }
    }
  },
  {
    desc: 'Multiple queries and trailing slash',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/?foo=bar&bool&no=42',
    result: {
      ...baseResult,
      path: '/',
      query: { foo: 'bar', bool: true, no: '42' }
    }
  },
  {
    desc: 'Fragment',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy#bool&foo=bar',
    result: {
      ...baseResult,
      fragment: '#bool&foo=bar',
      privateQuery: { foo: 'bar', bool: true }
    }
  },
  {
    desc: 'Path + query + fragment',
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
    desc: 'Path + trailing slash + query + fragment',
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
    desc: 'Different protocol',
    url: 'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy',
    result: {
      ...baseResult,
      protocol: 'slashfoo:'
    }
  },
  {
    desc: 'One missing character',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswh',
    result: baseResult
  },
  {
    desc: 'Extra characters (possible checksum)',
    url: 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhny7',
    result: baseResult
  }
]

testVectors.forEach((vector) => {
  test('test vector: ' + vector.desc, (t) => {
    const parsed = SlashURL.parse(vector.url)

    t.is(parsed.id, vector.result.id)
    t.alike(parsed.key, b4a.from(vector.result.key, 'hex'))
    t.is(parsed.protocol, vector.result.protocol)
    t.is(parsed.path, vector.result.path)
    t.alike(parsed.query, vector.result.query)
    t.is(parsed.fragment, vector.result.fragment)
    t.alike(parsed.privateQuery, vector.result.privateQuery)
  })
})
