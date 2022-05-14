import b4a from 'b4a'
import { expect } from 'aegir/chai'

import { sdk } from './helpers/setup-sdk.js'
import { SDK } from '../src/sdk.js'

describe('protocols:auth', () => {
  it('should share a private drive on success', async () => {
    // responder side
    const sdkA = await sdk()
    const responder = sdkA.slashtag({ name: 'responder' })

    const auth = responder.protocol(SDK.protocols.SlashAuth)

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
    const sdkB = await sdk()
    const initiator = await sdkB.slashtag({ name: 'initiator' })

    await initiator.setProfile({ name: 'John Doe' })
    const authInitiator = initiator.protocol(SDK.protocols.SlashAuth)
    const url = SDK.protocols.SlashAuth.formatURL(responder.url, 'foo')

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

    await sdkA.close()
    await sdkB.close()
  })
})
