import fs from 'fs'
import path from 'path'

const distPath = path.join(import.meta.url, '../../dist/').replace('file:', '')
const filename = path.join(distPath, 'index.min.js')
const src = fs.readFileSync(filename).toString()

const A = {
  target:
    'for await(let i of this._activeQuery)if(!!this.isClient)for(let s of i.peers)this._onpeer(s,i)',
  res: `
await new Promise((resolve, reject) => {
  const s = this._activeQuery;
  s.on('data', (i) => {
    if (!!this.isClient) for (let s of i.peers) this._onpeer(s, i);
  });
  s.on('end', resolve);
  s.on('error', reject);
});
`
}

const B = {
  target: 'for await(let i of this.createReadStream(e,n))r.push(i)',
  res: `
const s = this.createReadStream(e, n);
await new Promise((resolve, reject) => {
    s.on('data', (i) => {r.push(i)});
    s.on('end', resolve);
    s.on('error', reject);
});
`
}

const header = `
/* eslint-disable */
import 'react-native-url-polyfill/auto';
`

fs.writeFileSync(
  path.join(distPath, 'rn.js'),
  header + src.replace(A.target, A.res).replace(B.target, B.res)
)
