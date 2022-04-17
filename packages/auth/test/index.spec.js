import { expect } from 'aegir/utils/chai.js'
import { SDK } from '@synonymdev/slashtags-sdk'
import { SlashAuth } from '../src/index.js'

const { RELAY_URL, BOOTSTRAP } = process.env
const bootstrap = JSON.parse(BOOTSTRAP)

function sdk (opts = {}) {
  return SDK.init({ bootstrap, relays: [RELAY_URL], persistent: false })
}

describe('SlashAuth', () => {
  it('should format a slashauth url from a Slashtag and a token', async () => {
    const sdkServer = await sdk()
    const serverSlashtag = sdkServer.slashtag({ name: 'Server' })

    const slashauthUrl = SlashAuth.formatURL(serverSlashtag.url, 'foo')

    expect(slashauthUrl).to.equal(
      serverSlashtag.url.replace('slash://', 'slashauth://') + '?q=foo'
    )

    sdkServer.close()
  })

  it('should pass the token to the server', async () => {
    // Server side
    const sdkServer = await sdk()
    const serverSlashtag = sdkServer.slashtag({ name: 'Server' })
    await serverSlashtag.ready()

    const auth = serverSlashtag.registerProtocol(SlashAuth)

    const result = new Promise((resolve) => {
      auth.on('request', async (request, response) => {
        const remoteSlashtag = request.peerInfo.slashtag
        await remoteSlashtag.ready()
        const remoteProfile = await remoteSlashtag.getProfile()

        response.success()

        resolve({
          token: request.token,
          profile: remoteProfile
        })
      })
    })

    await serverSlashtag.listen()

    // Wallet side

    const sdkWallet = await sdk()
    const walletSlashtag = sdkWallet.slashtag({ name: 'Server' })
    await walletSlashtag.ready()

    await walletSlashtag.setProfile({
      name: 'John Doe'
    })

    const authWalletSide = walletSlashtag.registerProtocol(SlashAuth)

    const url = SlashAuth.formatURL(serverSlashtag.url, 'foo')

    await authWalletSide.request(url)

    expect(await result).to.eql({
      token: 'foo',
      profile: {
        name: 'John Doe'
      }
    })

    const success = await new Promise((resolve) => {
      authWalletSide.on('success', () => resolve(true))
    })

    expect(success).to.eql(true)

    sdkServer.close()
    sdkWallet.close()
  })

  it('server should return an error to wallet', async () => {
    const ServerErrorMessage = 'SERVER_ERROR_MESSAGE'

    // Server side
    const sdkServer = await sdk()
    const serverSlashtag = sdkServer.slashtag({ name: 'Server' })
    await serverSlashtag.ready()

    const auth = serverSlashtag.registerProtocol(SlashAuth)

    auth.on('request', async (request, response) => {
      response.error(new Error(ServerErrorMessage))
    })

    await serverSlashtag.listen()

    // Wallet side

    const sdkWallet = await sdk()
    const walletSlashtag = sdkWallet.slashtag({ name: 'Server' })
    await walletSlashtag.ready()

    const authWalletSide = walletSlashtag.registerProtocol(SlashAuth)

    const url = SlashAuth.formatURL(serverSlashtag.url, 'foo')

    await authWalletSide.request(url)

    const error = await new Promise((resolve) => {
      authWalletSide.on('error', (error) => resolve(error))
    })

    expect(error).to.eql(ServerErrorMessage)

    sdkServer.close()
    sdkWallet.close()
  })
})
