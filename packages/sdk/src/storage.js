import { homedir } from 'os'

const DEFAULT_DIRECTORY = '.slashtags'

export const storage = (path) => {
  if (path) return path
  return homedir() + '/' + DEFAULT_DIRECTORY + '/'
}
