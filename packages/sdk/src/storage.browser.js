import RAW from 'random-access-web'
import RAM from 'random-access-memory'

if(typeof window !== "undefined"){
  // @ts-ignore
  global = window
}

const requestFileSystem =
  // @ts-ignore
  global.requestFileSystem || global.webkitRequestFileSystem

/**
 *
 * @param {string} name
 * @returns
 */
export const storage = (name) => {
  // TODO support indexedDB
  if (!requestFileSystem) return RAM

  try {
    (() => window)()
  } catch (error) {
    return RAM
  }

  // @ts-ignore
  const store = RAW(name)
  return store
}
