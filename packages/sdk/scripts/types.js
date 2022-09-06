import fs from 'fs'
import path from 'path'

export const root = path.join(import.meta.url, '../../').replace('file:', '')

const typesPath = path.join(root, 'types/')

const typesCode = `export * from '../index.js'
//# sourceMappingURL=index.d.ts.map`

try {
  fs.mkdirSync(typesPath)
} catch (error) {}
fs.writeFileSync(path.join(typesPath, 'index.min.d.ts'), typesCode)
