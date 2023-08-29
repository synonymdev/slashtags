const b4a = require('b4a')
const SlashURL = require('../index.js')
const test = require('brittle')

test('basic', t => {
  const key = b4a.from(
    'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
    'hex'
  )
  const url = SlashURL.format(key)

  t.is(url, 'slash:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy')
})

test('invalid key', t => {
  // @ts-ignore
  t.exception(() => SlashURL.format('foo'), /Key must be a Buffer/)
  t.exception(
    () => SlashURL.format(b4a.from('cce18ed41101509ab171a0a9b54aaf67a', 'hex')),
    /Key must be 32-bytes long/
  )
})

test('protocol - path - query - fragment', t => {
  const key = b4a.from(
    'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
    'hex'
  )

  t.is(
    SlashURL.format(key, {
      protocol: 'slashfoo:',
      path: '/',
      query: 'foo',
      fragment: 'fava'
    }),
    'slashfoo:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/?foo#fava'
  )

  t.is(
    SlashURL.format(key, {
      protocol: 'slashfoo', // tolerate missing :
      path: 'dir/file.json', // tolerate missing leading slash
      query: { foo: 'bar' },
      fragment: { foo: 'zar' }
    }),
    'slashfoo:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/dir/file.json?foo=bar#foo=zar'
  )

  t.is(
    SlashURL.format(key, {
      protocol: 'slashfoo', // tolerate missing :
      path: 'dir/file.json', // tolerate missing leading slash
      query: { foo: 'bar', baz: 'zar' },
      fragment: { foo: 'zar' }
    }),
    'slashfoo:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/dir/file.json?foo=bar&baz=zar#foo=zar'
  )

  t.is(
    SlashURL.format(key, {
      query: '?foo=bar',
      fragment: '#foo=zar'
    }),
    'slash:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo=bar#foo=zar',
    'handle string query and fragment'
  )

  t.is(
    SlashURL.format(key, {
      query: 'foo=bar',
      fragment: 'foo=zar'
    }),
    'slash:3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo=bar#foo=zar',
    'tolerate missing leading ? and #'
  )
})
