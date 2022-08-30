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
