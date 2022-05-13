import { expect } from 'aegir/chai'
import b4a from 'b4a'
import { DHT } from 'dht-universal'

import { Slashtag } from '../src/index.js'
import { getSwarmOpts } from './helpers/swarmOpts.js'

const swarmOpts = getSwarmOpts()

describe('connect', () => {
  it('should connect to a Hyperswarm/dht server', async () => {
    const dht = await DHT.create(swarmOpts)
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const server = dht.createServer()
    const serverGotMessage = new Promise((resolve) => {
      server.on('connection', (conn) => {
        conn.on('data', (data) => {
          if (b4a.equals(data, b4a.from('hello world'))) resolve(true)
        })
        conn.on('error', () => dht.destroy())
      })
    })
    await server.listen()

    const { connection, peerInfo } = await alice.connect(
      dht.defaultKeyPair.publicKey
    )

    expect(connection.remotePublicKey).to.eql(
      dht.defaultKeyPair.publicKey,
      'should connect to the correct public key'
    )
    expect(await connection.opened).to.be.true()
    expect(peerInfo.publicKey).to.eql(
      dht.defaultKeyPair.publicKey,
      'should augment peerInfo with a Slashtag instance generated from the remote peer public key'
    )
    expect(peerInfo.slashtag.key).to.eql(
      dht.defaultKeyPair.publicKey,
      "Slahstag's client connection should augment peerInfo with a Slashtag instance generated from the remote peer public key"
    )

    expect(peerInfo.slashtag.swarm).to.equal(
      alice.swarm,
      'Should pass the parent Hyperswarm node to the remote sub-slashtags'
    )

    expect(alice.swarm.listenerCount('connection')).to.equal(
      1,
      'should remove the event listener after Slashtag.connect() is done'
    )

    await peerInfo.slashtag.close()

    expect(alice.swarm.destroyed).to.be.false(
      'should not destroy the parent Hyperswarm node'
    )

    connection.write(b4a.from('hello world'))

    expect(await serverGotMessage).to.eql(true)

    await alice.close()
    await dht.destroy()
  })

  it('should not try to open an existing and open connection', async () => {
    const dht = await DHT.create(swarmOpts)
    const server = dht.createServer()
    await server.listen()

    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
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
      swarmOpts
    })

    await expect(alice.connect(alice.key)).to.eventually.be.rejectedWith(
      /^Cannot connect to self$/
    )
  })

  it('should throw an error for trying to listen on a remote slashtag', async () => {
    const alice = new Slashtag({
      key: Slashtag.createKeyPair().publicKey,
      swarmOpts
    })

    expect(alice.remote).to.be.true()
    await expect(
      alice.connect(b4a.from('a'.repeat(64), 'hex'))
    ).to.eventually.be.rejectedWith(/^Cannot connect from a remote slashtag$/)
  })

  it('should be able to connect to a Slashtag url', async () => {
    const alice = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    await expect(alice.connect(alice.url)).to.be.eventually.rejectedWith(
      'Cannot connect to self'
    )
    await expect(
      alice.connect(alice.url.toString())
    ).to.be.eventually.rejectedWith('Cannot connect to self')

    await alice.close()
  })
})
