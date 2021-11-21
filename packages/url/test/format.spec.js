import { addAction, format, schemasByTitle } from '../src/index.js'
import * as DocID from '@synonymdev/slashtags-docid'
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
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Accounts Payload'])

  const url = format(docID, {
    title: 'Bitrefill',
    image: 'https://www.bitrefill.com/content/assets/Logo_Aavatar.png',
    pubKey:
      '03fc888ae931411ff9fc1217fe67612ef6185eb199fb0cbd19a5ef05a2f0aabd3b',
    challenge:
      '67612ef6185eb199fb0cbd19a5ef05a2f0aabd3b03fc888ae931411ff9fc1217fe',
    cbURL: 'https://www.bitrefill.com/slashtags/accounts/response'
  })

  t.deepEqual(
    url,
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/#ugAR7InRpdGxlIjoiQml0cmVmaWxsIiwiaW1hZ2UiOiJodHRwczovL3d3dy5iaXRyZWZpbGwuY29tL2NvbnRlbnQvYXNzZXRzL0xvZ29fQWF2YXRhci5wbmciLCJwdWJLZXkiOiIwM2ZjODg4YWU5MzE0MTFmZjlmYzEyMTdmZTY3NjEyZWY2MTg1ZWIxOTlmYjBjYmQxOWE1ZWYwNWEyZjBhYWJkM2IiLCJjaGFsbGVuZ2UiOiI2NzYxMmVmNjE4NWViMTk5ZmIwY2JkMTlhNWVmMDVhMmYwYWFiZDNiMDNmYzg4OGFlOTMxNDExZmY5ZmMxMjE3ZmUiLCJjYlVSTCI6Imh0dHBzOi8vd3d3LmJpdHJlZmlsbC5jb20vc2xhc2h0YWdzL2FjY291bnRzL3Jlc3BvbnNlIn0'
  )
})

test('should not throw an error for invalid payload by default', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Accounts Payload'])

  t.deepEqual(
    format(docID, {
      challenge: 'foo',
      cbURL: 'noturl'
    }),
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoibm90dXJsIn0'
  )
})

test('should throw an error for invalid payload', (t) => {
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Accounts Payload'])

  t.throws(
    () =>
      format(
        docID,
        {
          title: 'Bitrefill',
          image:
            'https://www.bitrefill.com/content/cn/raw/upload/v1618914260/assets/Logo_Aavatar.png',
          challenge: 'foo',
          pubKey: 'bar',
          cbURL: 'noturl'
        },
        true
      ),
    {
      instanceOf: Error,
      message:
        'Invalid payload for schema: Slashtag Accounts Payload\n' +
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
  const docID = DocID.CID.fromJSON(schemasByTitle['Slashtag Accounts Payload'])

  const url = format(docID, {
    challenge: 'foo',
    cbURL: 'https:www.example.com',
    additional1: 'foo',
    additional2: 2
  })

  t.deepEqual(
    url,
    'slashtags:b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z/#ugAR7ImNoYWxsZW5nZSI6ImZvbyIsImNiVVJMIjoiaHR0cHM6d3d3LmV4YW1wbGUuY29tIn0'
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
