import b4a from 'b4a'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { SDK, protocols, SlashURL } from '@synonymdev/slashtags-sdk'

// Setting up the SDK and Initiator's Slashtag
console.log('setting up slashtag...')
const sdk = await SDK.init({
  storage: path.join(os.tmpdir(), 'slashtags-examples/auth/initiator'),
  primaryKey: b4a.from('b'.repeat(64), 'hex')
})
const initiator = sdk.slashtag({ name: 'Initiator' })
await initiator.setProfile({
  id: initiator.url.toString(),
  type: 'Person',
  name: 'Alice Bob',
  url: 'https://alice.bob',
  description: 'Alice is a very good person'
})
console.log('Slashtag is ready: ' + initiator.url)

// Resolve the Responder's Profile to ask User for confirmation
// In a normal App, this step can be cached and skipped for subsequent requests.
const url = process.env.url || urlFromFile()
await resolveProfile(sdk, url)

// Simulate a user confirming auth request
console.log('\nClick any key to authenticate...')
process.stdin.once('data', async (data) => {
  // SlashAuth protocol is already available on the initiator (included in the SDK)
  // And we can access its instance from anywhere on the initiator as follows:
  const auth = initiator.protocol(protocols.SlashAuth)

  // Once the Responder has accepted the request, we can access the drive they shared with us
  console.time('auth response')
  auth.once('success', onSuccess)

  // Making an Auth request
  const { drive: sharedByMe } = await auth.request(new SlashURL(url))

  // Writing a message _to_ the responder on the drive we shared with them
  await sharedByMe.put('messages/1', b4a.from('Hello from Initiator'))
})

async function resolveProfile (sdk, url) {
  console.log('\n\nResolving profile for:\n', url)
  console.time('resolve profile')

  const responderProfile = await sdk
    .slashtag({ key: new SlashURL(url).slashtag.key })
    .getProfile()

  console.log("Responder's profile: ", responderProfile)
  console.timeEnd('resolve profile')
}

async function onSuccess ({ drive }) {
  console.log('Success')
  console.timeEnd('auth response')

  const sharedWithMe = await initiator.drive(drive)
  await sharedWithMe.ready()
  console.log('shared drive is readable', sharedWithMe.readable)
  // Now you can read and list metadata of this drive, and even watch for changes in it.
  // For simplicity, we will leave that for another example.
}

function urlFromFile () {
  return fs
    .readFileSync(path.join(os.tmpdir(), 'slashtags-examples/auth/url.txt'))
    .toString()
}
