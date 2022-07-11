import b4a from 'b4a'
import EventEmitter from 'events'

import { expect } from 'aegir/chai'
import { catchConnection, fletcher16 } from '../src/utils.js'

const checksumTestVectors = [
  ['abcde', 'c8f0'],
  ['abcdef', '2057'],
  ['abcdefgh', '0627'],
  ['cce18ed41101509ab171a0a9b54aaf67af1aa421597a139e5ffe5e4867f3b538', '28f6'],
  ['ed4d3f0ee964def139562cc7fc349194131f9fefc59fc7e083b0eb2a0d354c44', '576f'],
  ['67412cd16b4d9624018c4c4d17079c5db971d1c65b7a10382ea325d96a18f8a7', '372f']
]

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

  describe('fletcher16', () => {
    checksumTestVectors.forEach(([input, checksum]) => {
      it('should pass test vector: ' + input, () => {
        const buf =
          input.length === 64 ? b4a.from(input, 'hex') : b4a.from(input)

        expect(fletcher16(buf)).to.eql(b4a.from(checksum, 'hex'))
      })
    })
  })
})
