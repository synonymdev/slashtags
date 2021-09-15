import { addAction, format } from '../src/index.js'
import * as DocID from '@synonymdev/slashtags-docid'
import { schemasByTitle } from '../src/constants/index.js'
import test from 'ava'

test('should format slashtags base document url correctly from DocID', (t) => {
  const docID = DocID.CID.fromJSON({ foo: 'bar' })
  const url = format(docID)

  t.deepEqual(
    url,
    'slashtags://b2iaqaamaaqjca6ryx6a7ha7wsqz223uqbu23hyrykwj7o2t3pk25ink3rosb5ysl/'
  )
})

test('should format slashtags base document url correctly from string', (t) => {
  const docID = DocID.CID.fromJSON({ foo: 'bar' })
  const url = format(DocID.toString(docID))

  t.deepEqual(
    url,
    'slashtags://b2iaqaamaaqjca6ryx6a7ha7wsqz223uqbu23hyrykwj7o2t3pk25ink3rosb5ysl/'
  )
})

// Actions

test('should throw an error for unknown actions', (t) => {
  const docID = DocID.CID.fromJSON({})

  t.throws(() => format(docID, {}), {
    instanceOf: Error,
    message:
      'Unknown slashtags action: b2iaqaamaaqjcaratn6rvlm3hriiunliw67ugjhuu7nh4eh7hp2brbqda6yokv74k'
  })
})

test('should format slashtags action url correctly from DocID', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Auth Action'])

  const url = format(docID, {
    challenge: 'foo',
    cbURL: 'https:www.example.com'
  })

  t.deepEqual(
    url,
    'slashtags:b2iaqaamaaqjcbw7zetxujobillqlmizi6uroscubpzsb72xzmisfcq7fhbg27xbm/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0'
  )
})

test('should not throw an error for invalid payload by default', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Auth Action'])

  t.deepEqual(
    format(docID, {
      challenge: 'foo',
      cbURL: 'noturl'
    }),
    'slashtags:b2iaqaamaaqjcbw7zetxujobillqlmizi6uroscubpzsb72xzmisfcq7fhbg27xbm/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoibm90dXJsIn0'
  )
})

test('should throw an error for invalid payload', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Auth Action'])

  t.throws(
    () =>
      format(
        docID,
        {
          challenge: 'foo',
          remotePK: 'bar',
          cbURL: 'noturl'
        },
        true
      ),
    {
      instanceOf: Error,
      message:
        'Invalid payload for schema: Slashtag Auth Action\n' +
        JSON.stringify(
          [
            {
              instancePath: '/cbURL',
              schemaPath: '#/properties/cbURL/format',
              keyword: 'format',
              params: { format: 'uri' },
              message: 'must match format "uri"'
            }
          ],
          null,
          2
        )
    }
  )
})

test('should remove additional fields from the actionPayload', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Auth Action'])

  const url = format(docID, {
    challenge: 'foo',
    cbURL: 'https:www.example.com',
    additional1: 'foo',
    additional2: 2
  })

  t.deepEqual(
    url,
    'slashtags:b2iaqaamaaqjcbw7zetxujobillqlmizi6uroscubpzsb72xzmisfcq7fhbg27xbm/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0'
  )
})

test('should throw an error for too big of a payload', (t) => {
  const actionID = addAction({
    title: 'empty',
    description: 'does nothing',
    properties: { foo: { type: 'string' } },
    additionalProperties: false
  })

  t.throws(
    () =>
      format(actionID, {
        foo: 'foo'.repeat(1000000)
      }),
    {
      instanceOf: Error,
      message:
        'Payload is too big, url max length should be 2000 character, got: ' +
        4000094
    }
  )
})
