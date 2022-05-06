import { expect } from 'aegir/chai'
import { Slashtag } from '@synonymdev/slashtag'
import { SlashAuth } from '../src/index.js'
import b4a from 'b4a'

const { RELAY_URL, BOOTSTRAP, MAINNET } = process.env
const bootstrap = MAINNET ? undefined : JSON.parse(BOOTSTRAP)

const swarmOpts = { relays: [RELAY_URL], bootstrap }

describe('SlashAuth', () => {
  it('should format a slashauth url from a Slashtag and a token', async () => {
    const responder = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const slashauthUrl = SlashAuth.formatURL(responder.url, 'foo')

    expect(slashauthUrl).to.equal(
      responder.url.toString().replace('slash://', 'slashauth://') + '?q=foo'
    )

    await responder.close()
  })

  it('responder should pass an error to initiator', async () => {
    const ServerErrorMessage = 'SERVER_ERROR_MESSAGE'

    // responder side
    const responder = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const auth = responder.protocol(SlashAuth)

    auth.once('request', async (request, response) => {
      response.error(new Error(ServerErrorMessage))
    })

    await responder.listen()

    // initiator side

    const initiator = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const authInitiator = initiator.protocol(SlashAuth)

    const url = SlashAuth.formatURL(responder.url, 'foo')

    await authInitiator.request(url)

    const error = await new Promise((resolve) => {
      authInitiator.once('error', (error) => resolve(error))
    })

    expect(error.message).to.eql(ServerErrorMessage)

    await responder.close()
    await initiator.close()
  })

  it('should share a private drive on success', async () => {
    // responder side
    const responder = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    const auth = responder.protocol(SlashAuth)

    const responderGotRequest = new Promise((resolve, reject) => {
      auth.once('request', async (request, response) => {
        try {
          const remoteSlashtag = request.peerInfo.slashtag
          const remoteProfile = await remoteSlashtag.getProfile()
          expect(remoteProfile).to.eql(
            { name: 'John Doe' },
            "should be able to resolve initiator's profile"
          )

          const sharedByInitiator = await remoteSlashtag.drive(request.drive)
          expect(await sharedByInitiator.get('messages/1')).to.eql(
            b4a.from('Hello from Initiator'),
            'Should be able to resolve messages shared by the initiator'
          )

          // Writing a message _to_ the initiator
          const { drive: sharedByResponder } = await response.success()
          await sharedByResponder.put(
            'messages/1',
            b4a.from('Hello from Responder')
          )

          expect(request.token).to.eql(
            'foo',
            'should get the correct token from the initiator'
          )

          resolve(true)
        } catch (error) {
          reject(error)
        }
      })
    })

    await responder.listen()

    // initiator side
    const initiator = new Slashtag({
      keyPair: Slashtag.createKeyPair(),
      swarmOpts
    })

    await initiator.setProfile({ name: 'John Doe' })
    const authInitiator = initiator.protocol(SlashAuth)
    const url = SlashAuth.formatURL(responder.url, 'foo')

    const { drive: sharedByInitiator } = await authInitiator.request(url)

    // Sending data to the responder using the shared drive
    await sharedByInitiator.put('messages/1', b4a.from('Hello from Initiator'))

    const initiatorGotSuccess = await new Promise((resolve) => {
      authInitiator.once('success', async ({ drive }) => {
        expect(drive.key.length).to.eql(32)
        expect(drive.encryptionKey.length).to.eql(32)

        const responderSharedDrive = await initiator.drive(drive)
        expect(await responderSharedDrive.get('messages/1')).to.eql(
          b4a.from('Hello from Responder')
        )

        resolve(true)
      })
    })

    expect(await responderGotRequest).to.be.true()
    expect(await initiatorGotSuccess).to.be.true()

    await responder.close()
    await initiator.close()
  })
})
