import SDK from '@synonymdev/slashtags-sdk'
import c from 'compact-encoding'

(async () => {
  let key;
  {
    const sdk = new SDK({ relay: 'ws://localhost:45475'});
    const alice = sdk.slashtag()
    console.log({alice: alice.url})
    const drive = alice.drivestore.get()
    await drive.put('/profile.json', c.encode(c.json, { name: 'Alice' }))

    console.log("Announcing Alice's public drive...")
    await sdk.join(drive.discoveryKey).flushed()

    key = alice.key
  }

  {
    const sdk = new SDK({ relay: 'ws://localhost:45475'});
    const bob = sdk.slashtag()
    console.log({bob: bob.url})
    const drive = sdk.drive(key)
    console.log("Resolving Alice's public drive...")
    await drive.ready()
    const profile = await drive.get('/profile.json')
      .then(b => b && c.decode(c.json, b))
    console.log("Profile:", profile)
  }
})()
