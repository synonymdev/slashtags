import SDK from '@synonymdev/slashtags-sdk'
import b4a from 'b4a'

(async () => {

  let key

  {
    const sdk = new SDK({ relay: 'ws://localhost:45475' })
    const alice = sdk.slashtag()
    console.log({ alice: alice.url })
    const drive = alice.drivestore.get()
    await drive.put('/profile.json', b4a.from(JSON.stringify({ name: 'Alice' })))

    console.log("Announcing Alice's public drive...")
    await sdk.join(drive.discoveryKey)?.flushed()

    key = alice.key
  }

  {
    const sdk = new SDK({ relay: 'ws://localhost:45475' })
    const bob = sdk.slashtag()
    console.log({ bob: bob.url })
    const drive = sdk.drive(key)
    console.log("Resolving Alice's public drive...")
    const profile = await drive.get('/profile.json')
      .then(buf => buf && JSON.parse(b4a.toString(buf)))
    console.log("Profile:", profile)
  }
})()
