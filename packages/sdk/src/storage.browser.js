import RAW from 'random-access-web'
import RAM from 'random-access-memory'

const requestFileSystem =
  global.requestFileSystem || global.webkitRequestFileSystem

export const storage = (name) => {
  // TODO support indexedDB
  if (!requestFileSystem) return RAM

  try {
    (() => window)()
  } catch (error) {
    return RAM
  }

  const store = RAW(name)
  return store
}
