import test from 'brittle'

import Slashtag from '../index.js'

test('drive - putProfile, deleteProfile, getProfile', async t => {
  const alice = new Slashtag()

  const profile = {
    name: 'foo',
    bio: 'bar',
    image: 'baz',
    links: [
      { url: 'https://example.com', title: 'example' }
    ]
  }

  await alice.putProfile(profile)

  const read = await alice.drivestore.get().get('/profile.json')
    .then(buf => JSON.parse(buf.toString()))
  t.alike(read, profile)

  const getResponse = await alice.getProfile()
  t.alike(getResponse, profile)

  await alice.deleteProfile()

  const deleted = await alice.getProfile()
  t.is(deleted, null)

  alice.close()
})
