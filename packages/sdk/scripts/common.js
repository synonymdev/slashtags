import fs from 'fs'
import path from 'path'

export const root = path.join(import.meta.url, '../../').replace('file:', '')

export { fs, path }
