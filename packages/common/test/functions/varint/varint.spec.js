import { expect } from 'aegir/utils/chai.js'
import * as varint from '../../../src/functions/varint.js'
import originalVarint from 'varint'

describe('varint', () => {
  describe('split', () => {
    it('should return a tuple of the first varint and the rest', () => {
      const bytes = new TextEncoder().encode('foobar')
      const int = [42, 128, 110]

      const result = varint.prepend(int, bytes)

      expect(varint.split(result)).to.eql([
        42,
        Uint8Array.from([128, 1, 110, ...bytes]),
        1
      ])
    })
  })

  describe('prepend', () => {
    it('should prepend one integer as varint to a Uint8Array', () => {
      const bytes = new TextEncoder().encode('foobar')
      const int = 42

      const result = varint.prepend(int, bytes)
      expect(result).to.eql(Uint8Array.from([int, ...bytes]))
    })

    it('should prepend one integer bigger than 128 as varint to a Uint8Array', () => {
      const bytes = new TextEncoder().encode('foobar')
      const int = 128

      const result = varint.prepend(int, bytes)
      expect(result).to.eql(
        Uint8Array.from([...originalVarint.encode(int), ...bytes])
      )
    })

    it('should prepend multiple integers as varints to a Uint8Array', () => {
      const bytes = new TextEncoder().encode('foobar')
      const int = [42, 128, 110]

      const result = varint.prepend(int, bytes)

      expect(result).to.eql(Uint8Array.from([42, 128, 1, 110, ...bytes]))
    })
  })
})
