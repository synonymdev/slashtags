const test = require('brittle')
const Slashtag = require('@synonymdev/slashtag')

// Not in the test suite, but you can run it to verify that it works. `npx brittle test/legacy.js`
test('legacy - talking to older RPCs using Slashtag.connect', async (t) => {
  const slashtag = new Slashtag()

  await slashtag.profile.create({
    name: 'RPC test'
  })

  const SlashAuth = await import('@synonymdev/slashtags-auth')

  const client = new SlashAuth.Client(slashtag)

  // Accounts demo from the Playground. https://github.com/synonymdev/slashtags-playground-auth-demo
  const url = 'slash:unrreuy3r4qkadioomgrcfonqkf5d1smyegqpod3pp59aqxpruhy'

  const r2 = await client.magiclink(url)

  t.ok(r2.url.startsWith('https://www.synonym.to/products/slashtags/playground/accounts?user='))

  slashtag.close()
})
