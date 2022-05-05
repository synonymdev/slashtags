import c from 'compact-encoding'
import cstruct from 'compact-encoding-struct'
import Debug from 'debug'
import { SlashProtocol, SlashURL } from '@synonymdev/slashtag'

const debug = Debug('slashtags:protocol:slashauth')

export const SharedDrive = cstruct.compile({
  key: c.fixed32,
  encryptionKey: c.fixed32
})

const Request = cstruct.compile({
  token: c.string,
  drive: SharedDrive
})

const Success = cstruct.compile({
  drive: SharedDrive
})

const Error = cstruct.compile({
  message: c.string
})

export class SlashAuth extends SlashProtocol {
  static get protocol () {
    return 'slashauth:alpha'
  }

  get messages () {
    return [
      {
        // Request
        encoding: Request,
        onmessage: this._onRequest.bind(this)
      },
      {
        // Success
        encoding: Success,
        onmessage: this._onSuccess.bind(this)
      },
      {
        // Response
        encoding: Error,
        onmessage: this._onError.bind(this)
      }
    ]
  }

  /**
   * Emits the incoming request and success/error callbacks for the listening slashtag.
   *
   * @param {{token:string, drive: {key:Uint8Array, encryptionKey:Uint8Array}}} message
   * @param {*} channel
   */
  _onRequest (message, channel) {
    const self = this
    debug('Recieved request', message)

    this.emit(
      'request',
      {
        token: message.token,
        drive: message.drive,
        peerInfo: channel.peerInfo
      },
      {
        /**
         * Callback for passing a success message to the initiator.
         */
        success: async function () {
          const url = channel.peerInfo.slashtag.url
          const drive = await self.shareDrive.bind(self)(url.slashtag.base32)

          channel.messages[1].send({
            drive
          })
          return { drive }
        },
        /**
         * Callback for passing an error to the initiator.
         *
         * @param {Error} error
         */
        error: function (error) {
          channel.messages[2].send({
            message: error.message ? error.message : error.toString()
          })
        }
      }
    )
  }

  /**
   * Emits the success message when a success message is recieved.
   *
   * @param {SuccessMessage} message
   */
  _onSuccess (message) {
    debug('Recieved success', message)
    this.emit('success', message)
  }

  /**
   * Emits an error event with when an error message is recieved.
   *
   * @param {Error} error
   */
  _onError (error) {
    debug('Recieved error', error)
    this.emit('error', error)
  }

  /**
   * Initiates authentication to the given URL.
   * Returns the drive that was created and shared with the responder.
   *
   * @param {SlashURL | string} url
   */
  async request (url) {
    if (typeof url === 'string') url = new SlashURL(url)

    const q = url.searchParams.get('q')

    const { channel } = await this.connect(url.slashtag.key)

    /** @type {SlashDrive} */
    const drive = await this.slashtag.drive({
      name: url.slashtag.base32,
      encrypted: true
    })

    const driveData = {
      key: drive.key,
      encryptionKey: drive.encryptionKey
    }

    debug('Sending request', { driveData, q })

    channel.messages[0].send?.({
      token: q,
      drive: driveData
    })

    return { drive }
  }

  /**
   * Formats a slashauth: URL from the responder's Slashtag.
   *
   * @param {string | SlashURL} url
   * @param {string} token
   */
  static formatURL (url, token) {
    return (
      url.toString().replace(/^slash:\/\//, 'slashauth://') + '?q=' + token
    )
  }

  /**
   * Creates a private drive using a peer's key as a name.
   *
   * @param {string} keyBase32
   */
  async shareDrive (keyBase32) {
    const slashtag = this.slashtag

    const drive = await slashtag.drive({
      name: keyBase32,
      encrypted: true
    })

    return drive
  }
}

/**
 * @typedef {{key: Uint8Array, encryptionKey: Uint8Array}} SharedDrive
 * @typedef {{drive: SharedDrive}} SuccessMessage
 * @typedef {import('@synonymdev/slashdrive').SlashDrive} SlashDrive
 */
