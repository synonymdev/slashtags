import c from 'compact-encoding'
import { SlashtagProtocol, urlUtil } from '@synonymdev/slashtags-sdk'

export class SlashAuth extends SlashtagProtocol {
  static get protocol () {
    return 'slashauth:alpha'
  }

  get messages () {
    return [
      {
        // Request
        encoding: c.string,
        onmessage: this._onRequest.bind(this)
      },
      {
        // Success
        encoding: c.bool,
        onmessage: this._onSuccess.bind(this)
      },
      {
        // Response
        encoding: c.string,
        onmessage: this._onError.bind(this)
      }
    ]
  }

  _onRequest (message, channel) {
    this.emit(
      'request',
      {
        token: message,
        peerInfo: channel.peerInfo
      },
      {
        success: function () {
          channel.messages[1].send('ok')
        },
        error: function (error) {
          channel.messages[2].send(
            error.message ? error.message : error.toString()
          )
        }
      }
    )
  }

  _onSuccess () {
    this.emit('success')
  }

  _onError (error) {
    this.emit('error', error)
  }

  async request (url) {
    const parsed = urlUtil.parseURL(url)
    const q = parsed.query.get('q')

    const { channel } = await this.connect(parsed.key)

    channel.messages[0].send(q)
  }

  static formatURL (url, token) {
    return url.replace(/^slash:\/\//, 'slashauth://') + '?q=' + token
  }
}
