import b4a from 'b4a'
import * as SlashURL from '../index.js'
import test from 'brittle'

test('basic', (t) => {
  const key = b4a.from(
    'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
    'hex'
  )
  const url = SlashURL.format(key)

  t.is(url, 'slash://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy')
})

test('invalid key', (t) => {
  // @ts-ignore
  t.exception(() => SlashURL.format('foo'), 'Key must be a Buffer')
  t.exception(
    () => SlashURL.format(b4a.from('cce18ed41101509ab171a0a9b54aaf67a', 'hex')),
    'Key must be 32-bytes long'
  )
})

test('protocol - parth - query - fragment', (t) => {
  const key = b4a.from(
    'cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538',
    'hex'
  )

  t.is(
    SlashURL.format(key, {
      protocol: 'slashfoo',
      query: 'foo',
      fragment: 'fava'
    }),
    'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy?foo#fava'
  )

  t.is(
    SlashURL.format(key, {
      protocol: 'slashfoo',
      path: 'dir/file.json',
      query: { foo: 'bar' },
      fragment: { foo: 'zar' }
    }),
    'slashfoo://3uoa7iytyfejicmtwnw5k1ixc6ztijbbmf7b881993xro39uswhy/dir/file.json?foo=bar#foo=zar'
  )
})
