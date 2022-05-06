import b4a from 'b4a'
import { SDK, protocols } from '@synonymdev/slashtags-sdk'
import fs from 'fs'
import path from 'path'
import os from 'os'

listen()

let sdk, responder

async function listen () {
  await setupSlashtag()

  // SlashAuth protocol is already available on the initiator (included in the SDK)
  // And we can access its instance from anywhere on the initiator as follows:
  const auth = responder.protocol(protocols.SlashAuth)

  auth.on('request', async ({ token, peerInfo, drive }, response) => {
    console.log('\n\n\n === Success: got request, token: ', token)

    // By this point your app will have access to an instance of the Initiator's Slashtag.
    // Do not to block sending the success message by awaiting the resolution of the
    // profile/shared drive unless necessary for your application.
    readDrives(peerInfo.slashtag, drive)

    // Sending a Success response
    const { drive: sharedByResponder } = await response.success()
    sharedByResponder.ready()
    // Now you can start writing to this drive, and the initiator will be able to read it.
    // For simplicity, we will leave demonstrating that for another example.
  })

  // Session management is out of SlashAuth scope.
  // Your app should pass the token, and decide what do with it once received.
  const authURL = protocols.SlashAuth.formatURL(responder.url, 'FOOBAR')
  console.log('\n\n === SlashAuth URL: \n === ' + authURL)

  // Passing the url to the `request` script
  fs.writeFileSync(
    path.join(os.tmpdir(), 'slashtags-examples/auth/url.txt'),
    authURL
  )
}

async function readDrives (initiator, driveData) {
  const initiatorProfile = await initiator.getProfile()
  console.log('From:', initiatorProfile)

  // Read a message from the initiator on the drive they shared with us
  const sharedByInitiator = await initiator.drive(driveData)
  await sharedByInitiator.ready()
  console.log('shared drive is readable', sharedByInitiator.readable)
  // Now you can read and list metadata of this drive, and even watch for changes in it.
  // For simplicity, we will leave that for another example.
}

async function setupSlashtag () {
  sdk = await SDK.init({
    storage: path.join(os.tmpdir(), 'slashtags-examples/auth/responder'),
    primaryKey: b4a.from('a'.repeat(64), 'hex')
  })

  // Create a new Slashtag from a name
  responder = sdk.slashtag({ name: 'Responder' })

  // Set the responder's profile on their public drive
  await responder.setProfile({
    id: responder.url.toString(),
    type: 'Organization',
    name: 'Synonym',
    url: 'www.synonym.to',
    description: 'Web of trust for all'
  })
}
