import { root, path, fs } from './common.js'

const typesPath = path.join(root, 'types/dist')

const typesCode = `export * from '../src/index.js'
//# sourceMappingURL=index.d.ts.map`

try {
  fs.mkdirSync(typesPath)
} catch (error) {}
fs.writeFileSync(path.join(typesPath, 'index.min.d.ts'), typesCode)
fs.writeFileSync(path.join(typesPath, 'rn.d.ts'), typesCode)
