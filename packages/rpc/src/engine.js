import jsonrpc from 'jsonrpc-lite'
import b4a from 'b4a'

/**
 * @class
 * @returns
 */
export function Engine () {
  // TODO: Add use() function to add middlewares
  //   this.middlewares = [];

  /** @type {Record<string, Method>} */
  let _handlers = {}

  /**
   *
   * @param {Record<string, Method>} methods
   * @returns
   */
  this.addMethods = (methods) => (_handlers = { ..._handlers, ...methods })

  /**
   * @param {Request} request
   * @returns
   */
  this.handle = async function (request) {
    const parsed = jsonrpc.parseObject(request)

    if (parsed.type === 'invalid') {
      return JSON.stringify(parsed.payload)
    } else if (parsed.type === 'request') {
      try {
        if (!(parsed.payload.method in _handlers)) {
          throw new jsonrpc.JsonRpcError(
            `Method not found: ${parsed.payload.method}`,
            -32601
          )
        }

        const apiRes = await _handlers[parsed.payload.method](request)
        return JSON.stringify(jsonrpc.success(parsed.payload.id, apiRes))
      } catch (/** @type {*} */ e) {
        const rpcErr = new jsonrpc.JsonRpcError(
          e.message || e.toString(),
          e.code || -32000,
          e.data
        )
        return JSON.stringify(jsonrpc.error(parsed.payload.id, rpcErr))
      }
    }
  }

  const waitingFrames = new Map()
  let callID = 0

  /**
   *
   * @param {Uint8Array} data
   */
  this.handleResponse = async function (data) {
    const message = JSON.parse(b4a.toString(data, 'utf8'))
    const waitingFrame = waitingFrames.get(message.id)
    if (message.result) waitingFrame?.resolve(message)
    if (message.error) waitingFrame?.reject(message)
  }

  /**
   *
   * @param {string} method
   * @param {RpcParams} params
   * @param {NoiseSocket} noiseSocket
   * @throws {Error}
   */
  this.call = async function (method, params, noiseSocket) {
    const message = {
      jsonrpc: '2.0',
      method: method,
      params,
      id: callID++
    }

    noiseSocket.write(JSON.stringify(message))

    const response = await new Promise(function (resolve, reject) {
      waitingFrames.set(message.id, {
        resolve,
        reject
      })
    })

    const parsed = jsonrpc.parseObject(response)
    return {
      // @ts-ignore
      body: parsed.payload.result,
      noiseSocket
    }
  }
}

/** @typedef {import ('./interfaces').RpcParams} RpcParams */
/** @typedef {import ('./interfaces').NoiseSocket} NoiseSocket */
/** @typedef {import ('./interfaces').EngineMethod} Method */
/** @typedef {import ('./interfaces').EngineRequest} Request */
