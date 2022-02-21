const path = require('path');
const fs = require('fs');

const packagejson = (name, description) => `{
  "name": "${name}",
  "version": "0.0.0",
  "description": "${description}",
  "type": "module",
  "keywords": [

  ],
  "homepage": "https://github.com/synonymdev/slashtags/tree/master/packages/${name}/#readme",
  "bugs": {
    "url": "https://github.com/synonymdev/slashtags/issues"
  },
  "license": "MIT",
  "files": [
    "*",
    "!**/*.tsbuildinfo"
  ],
  "types": "types/src/index.d.ts",
  "typesVersions": {
    "*": {
      "*": [
        "types/*",
        "types/src/*"
      ],
      "types/*": [
        "types/*",
        "types/src/*"
      ]
    }
  },
  "main": "src/index.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/synonymdev/slashtags.git"
  },
  "scripts": {
    "build": "aegir build",
    "test": "c8 aegir test",
    "lint": "aegir ts -p check && aegir lint --fix",
    "clean": "rimraf ./dist",
    "dep-check": "aegir dep-check"
  },
  "devDependencies": {
    "aegir": "^36.1.3"
  },
  "eslintConfig": {
    "env": {
      "mocha": true
    },
    "parserOptions": {
      "sourceType": "module"
    }
  }
}`;

const tsconfig = `{
  "extends": "aegir/src/config/tsconfig.aegir.json",
  "compilerOptions": { "outDir": "types" },
  "include": ["src", "package.json", "../../types"],
  "references": []
}`;

const main = () => {
  const name = process.argv[2];
  const description = process.argv[3] || '';
  if (!name) throw new Error('Package name is required');

  const _path = path.join(__dirname).replace(/scripts$/, 'packages/' + name);
  fs.mkdirSync(_path);
  fs.writeFileSync(
    path.join(_path, 'package.json'),
    packagejson(name, description),
  );
  fs.writeFileSync(path.join(_path, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(_path, 'README.md'), '# slashtags-' + name);
};

main();