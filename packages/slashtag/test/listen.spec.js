import { expect } from 'aegir/utils/chai.js'
import { DHT } from 'dht-universal'

import { Slashtag } from '../src/index.js'
import { swarmOpts } from './helpers/swarmOpts.js'

const dhtOpts = swarmOpts()

describe('listen', () => {
  it('should listen and receives dht connections', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts
    })

    await alice.listen()

    expect(alice.swarm.server.address().publicKey).to.eql(alice.key)

    const serverConnection = new Promise((resolve) =>
      alice.on('connection', (conn, peerInfo) => resolve({ conn, peerInfo }))
    )

    const dht = await DHT.create(dhtOpts)

    const connection = await dht.connect(alice.key)

    expect(connection.remotePublicKey).to.eql(alice.key)
    expect(await connection.opened).to.be.true()
    expect((await serverConnection).peerInfo.publicKey).to.eql(
      dht.defaultKeyPair.publicKey
    )
    expect((await serverConnection).peerInfo.slashtag.key).to.eql(
      dht.defaultKeyPair.publicKey,
      "Slahstag's server connection should augment peerInfo with a Slashtag instance generated from the remote peer public key"
    )

    await alice.close()
    expect(alice.swarm.server.closed).to.be.true()

    await dht.destroy()
  })

  it('should throw an error for trying to listen on a remote slashtag', async () => {
    const alice = new Slashtag({
      key: Slashtag.createKeyPair().publicKey,
      swarmOpts: dhtOpts
    })

    expect(alice.remote).to.be.true()
    await expect(alice.listen()).to.eventually.be.rejectedWith(
      /^Cannot listen on a remote slashtag$/
    )
  })
})
