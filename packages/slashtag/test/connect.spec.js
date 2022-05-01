import { expect } from 'aegir/utils/chai.js'
import b4a from 'b4a'
import { DHT } from 'dht-universal'

import { Slashtag } from '../src/index.js'
import { swarmOpts } from './helpers/swarmOpts.js'

const dhtOpts = swarmOpts()

describe('connect', () => {
  it('should listen and receives dht connections', async () => {
    const dht = await DHT.create(dhtOpts)
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts
    })

    const server = dht.createServer()
    const serverGotMessage = new Promise((resolve) => {
      server.on('connection', (conn) => {
        conn.on('data', resolve)
        conn.on('error', () => dht.destroy())
      })
    })
    await server.listen()

    const { connection, peerInfo } = await alice.connect(
      dht.defaultKeyPair.publicKey
    )

    expect(connection.remotePublicKey).to.eql(dht.defaultKeyPair.publicKey)
    expect(await connection.opened).to.be.true()
    expect(peerInfo.publicKey).to.eql(dht.defaultKeyPair.publicKey)
    expect(peerInfo.slashtag.key).to.eql(
      dht.defaultKeyPair.publicKey,
      "Slahstag's client connection should augment peerInfo with a Slashtag instance generated from the remote peer public key"
    )

    expect(alice.swarm.listenerCount('connection')).to.equal(
      1,
      'should remove the event listener after Slashtag.connect() is done'
    )

    connection.write(b4a.from('hello world'))

    expect(await serverGotMessage).to.eql(b4a.from('hello world'))

    await alice.close()
  })

  it('should not try to open an existing and open connection', async () => {
    const dht = await DHT.create(dhtOpts)
    const server = dht.createServer()
    await server.listen()

    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts
    })

    const firstCall = await alice.connect(server.address().publicKey)

    const secondCall = await alice.connect(server.address().publicKey)

    expect(secondCall.connection).to.eql(firstCall.connection)
    expect(secondCall.peerInfo).to.eql(firstCall.peerInfo)

    await dht.destroy()
    await alice.close()
  })

  it('should not connect to self', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts: dhtOpts
    })

    await expect(alice.connect(alice.key)).to.eventually.be.rejectedWith(
      /^Cannot connect to self$/
    )
  })

  it('should throw an error for trying to listen on a remote slashtag', async () => {
    const alice = new Slashtag({
      key: Slashtag.createKeyPair().publicKey,
      swarmOpts: dhtOpts
    })

    expect(alice.remote).to.be.true()
    await expect(
      alice.connect(b4a.from('a'.repeat(64), 'hex'))
    ).to.eventually.be.rejectedWith(/^Cannot connect from a remote slashtag$/)
  })
})
