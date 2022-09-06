import { homedir } from 'os'

const DEFAULT_DIRECTORY = '.slashtags'
const DEFAULT_DIRECTORY_PATH = homedir() + '/' + DEFAULT_DIRECTORY

/**
 * Storage in Nodejs environment.
 * Returns the default: `${homedir()}/.slashtags/` or echos the passed storage
 * @param {*} [storage]
 */
export const storage = storage => {
  return storage || DEFAULT_DIRECTORY_PATH
}
