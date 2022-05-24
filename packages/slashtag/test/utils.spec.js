import b4a from 'b4a'
import EventEmitter from 'events'

import { expect } from 'aegir/chai'
import { catchConnection } from '../src/utils.js'

describe('utils', () => {
  describe('catchConnection', () => {
    it('should not catch the wrong swarm connection', async () => {
      const swarm = new EventEmitter()

      const target = b4a.from('a'.repeat(32), 'hex')
      const falseTarget = b4a.from('f'.repeat(32), 'hex')

      const result = catchConnection(swarm, target)

      swarm.emit('connection', {}, { publicKey: falseTarget })
      swarm.emit('connection', {}, { publicKey: target })

      expect((await result).peerInfo.publicKey).to.eql(target)
    })
  })
})
