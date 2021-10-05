import { parse, PROTOCOL_NAME } from '../src/index.js'
import * as DocID from '@synonymdev/slashtags-docid'
import * as json from 'multiformats/codecs/json'
import { varint } from '@synonymdev/slashtags-common'
import { base64url } from 'multiformats/bases/base64'
import test from 'ava'

test('should throw an error if it has the wrong protocol', (t) => {
  const url = 'notslashtags://docid/path/to/sub/?tag=arsta#hash'

  t.throws(() => parse(url), {
    message: 'Protocol should be ' + PROTOCOL_NAME,
    instanceOf: Error
  })
})

test('should parse normal slashtags url correctly', (t) => {
  const docID = DocID.CID.fromJSON({ foo: 'bar' })

  const url = 'slashtags://' + DocID.toString(docID) + '/foo/?q=bar#hash'
  const parsed = parse(url)

  t.deepEqual(parsed, {
    ...new URL(url),
    protocol: PROTOCOL_NAME,
    docID: docID
  })
})

// Actions

test('should parse slashtags actions correctly', (t) => {
  const url =
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/path/just/to/be/sure/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0'

  const parsed = parse(url)

  t.deepEqual(parsed, {
    ...new URL(url),
    docID: DocID.parse(parsed.actionID),
    protocol: PROTOCOL_NAME,
    actionID:
      'b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z',
    payload: {
      challenge: 'foo',
      cbURL: 'https:www.example.com'
    }
  })
})

test('should remove any additional fields', (t) => {
  const payload = base64url.encode(
    varint.prepend(
      [json.code],
      json.encode({
        challenge: 'foo',
        cbURL: 'https:www.example.com',
        additonal1: 'foo',
        additonal2: 423
      })
    )
  )

  const url =
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/path/just/to/be/sure/#' +
    payload

  const parsed = parse(url)

  t.deepEqual(parsed, {
    ...new URL(url),
    docID: DocID.parse(parsed.actionID),
    protocol: PROTOCOL_NAME,
    actionID:
      'b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z',
    payload: {
      challenge: 'foo',
      cbURL: 'https:www.example.com'
    }
  })
})

test('should throw validation errors if the user chooses so', (t) => {
  const payload = base64url.encode(
    varint.prepend(
      [json.code],
      json.encode({
        challenge: 'foo',
        pubKey: 'bar',
        cbURL: 'invalid'
      })
    )
  )

  const url =
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/path/just/to/be/sure/#' +
    payload

  t.throws(() => parse(url, true), {
    instanceOf: Error,
    message:
      'Invalid payload for schema: Slashtag Accounts Payload\n' +
      JSON.stringify(
        [
          {
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: {
              missingProperty: 'title'
            },
            message: "must have required property 'title'"
          },
          {
            instancePath: '',
            schemaPath: '#/required',
            keyword: 'required',
            params: {
              missingProperty: 'image'
            },
            message: "must have required property 'image'"
          },
          {
            instancePath: '/cbURL',
            schemaPath: '#/properties/cbURL/format',
            keyword: 'format',
            params: {
              format: 'uri'
            },
            message: 'must match format "uri"'
          }
        ],
        null,
        2
      )
  })
})

test('should throw error on unknown actions', (t) => {
  const docID = DocID.toString(DocID.CID.fromJSON({}))

  const url = `slashtags:${docID}/path/just/to/be/sure/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0`

  t.throws(() => parse(url), {
    instanceOf: Error,
    message:
      'Unknown slashtags action: b2iaqaamaaqjcaratn6rvlm3hriiunliw67ugjhuu7nh4eh7hp2brbqda6yokv74k'
  })
})
