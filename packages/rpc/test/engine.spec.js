import test from 'ava'
import { Engine } from '../src/engine.js'

test('Engine: handle()', async (t) => {
  const engine = new Engine()

  engine.addMethods({
    ping: async (request) => {
      return 'pong:' + request.noiseSocket.handshakeHash
    }
  })

  const response = await engine.handle({
    jsonrpc: '2.0',
    id: 3423,
    method: 'ping',
    params: {},
    noiseSocket: {
      handshakeHash: Buffer.from('test-handshakehash')
    }
  })

  t.deepEqual(
    response,
    '{"jsonrpc":"2.0","id":3423,"result":"pong:test-handshakehash"}'
  )
})

test('Engine: throw parsing error', async (t) => {
  const engine = new Engine()

  engine.addMethods({
    ping: async (request) => {
      return 'pong:' + request.noiseSocket.handshakeHash
    }
  })

  const response = await engine.handle({ foo: 'bar' })

  t.deepEqual(
    response,
    '{"message":"Invalid request","code":-32600,"data":{"foo":"bar"}}'
  )
})

test('Engine: throw error on Method not found', async (t) => {
  const engine = new Engine()

  const response = await engine.handle({
    jsonrpc: '2.0',
    id: 3423,
    method: 'ping',
    params: { foo: 'bar' },
    noiseSocket: null
  })

  t.deepEqual(
    response,
    '{"jsonrpc":"2.0","id":3423,"error":{"message":"Method not found: ping","code":-32601}}'
  )
})

test('Engine: pass thrown errors from methods', async (t) => {
  const engine = new Engine()

  engine.addMethods({
    ping: async () => {
      throw new Error('test error from method')
    }
  })

  const response = await engine.handle({
    jsonrpc: '2.0',
    id: 3423,
    method: 'ping',
    params: { foo: 'bar' },
    noiseSocket: null
  })

  t.deepEqual(
    response,
    '{"jsonrpc":"2.0","id":3423,"error":{"message":"test error from method","code":-32000}}'
  )
})

test('Engine: pass thrown errors from methods, with no message', async (t) => {
  const engine = new Engine()

  engine.addMethods({
    ping: async () => {
      throw new Error()
    }
  })

  const response = await engine.handle({
    jsonrpc: '2.0',
    id: 3423,
    method: 'ping',
    params: { foo: 'bar' },
    noiseSocket: null
  })

  t.deepEqual(
    response,
    '{"jsonrpc":"2.0","id":3423,"error":{"message":"Error","code":-32000}}'
  )
})

test('Engine: handle raw Uint8Array data', async (t) => {
  const engine = new Engine()
  engine.addMethods({ 'ping:': () => 'pong' })

  const request = JSON.stringify({
    method: 'ping:',
    params: {},
    id: 1,
    jsonrpc: '2.0'
  })

  const uintRequest = Uint8Array.from(Buffer.from(request))

  const response = '{"jsonrpc":"2.0","id":1,"result":"pong"}'

  engine.handleRaw(uintRequest, {
    write: (data) => {
      t.deepEqual(data, response)
    }
  })

  engine.handleRaw(request, {
    write: (data) => {
      t.deepEqual(data, response)
    }
  })
})
