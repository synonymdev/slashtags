import { MESSAGES } from './constants.js'

/**
 * Call done() as many times as neccessary until it returns truthy value
 * or timeout is reached.
 * @param {(...args: any) => Promise<any> | any} done
 * @param {number} timeout
 * @returns
 */
export async function retry (done, timeout = 1000) {
  const start = Number(new Date())
  let _done = false
  let passed = 0
  while (!_done && passed < timeout) {
    _done = await done()
    passed = Number(new Date()) - start
  }
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {keyof import('./constants.js')['MESSAGES']} type
 * @param {object} payload
 */
export function request (ws, type, payload) {
  return ws.send(JSON.stringify({
    type: MESSAGES[type],
    payload
  }))
}
