import { homedir } from 'os'

const DEFAULT_DIRECTORY = '.slashtags'
const DEFAULT_DIRECTORY_PATH = homedir() + '/' + DEFAULT_DIRECTORY

/**
 * Default storage in Nodejs environment.
 */
export const defaultStorage = DEFAULT_DIRECTORY_PATH
