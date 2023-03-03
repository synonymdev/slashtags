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
 * @param {REQUESTS[keyof REQUESTS]} type
 * @param {object} payload
 */
export function request (ws, type, payload) {
  return ws.send(JSON.stringify({ type, payload }))
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {RESPONSES[keyof RESPONSES]} type
 * @param {object} payload
 */
export function respond (ws, type, payload) {
  return ws.send(JSON.stringify({ type, payload }))
}

/**
 * @typedef {import('./constants')['RESPONSES']} RESPONSES
 * @typedef {import('./constants')['REQUESTS']} REQUESTS
 */
