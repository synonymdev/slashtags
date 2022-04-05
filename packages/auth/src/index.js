import c from 'compact-encoding'
import { EventEmitter } from 'events'
import { SDK } from '@synonymdev/slashtags-sdk'

export class SlashAuth extends EventEmitter {
  constructor (slashtag) {
    super()
    this.slashtag = slashtag

    this.options = {
      protocol: 'slashauth:alpha',
      messages: [
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

  listen () {
    return this.slashtag.listen()
  }

  async request (url) {
    const parsed = SDK.parseURL(url)
    const q = parsed.query.get('q')

    const connection = await this.slashtag.connect(parsed.key)

    const channel = connection.userData.channels.get(this.options.protocol)
    channel.messages[0].send(q)
  }

  static formatURL (url, token) {
    return url.replace(/^slash:\/\//, 'slashauth://') + '?q=' + token
  }
}
