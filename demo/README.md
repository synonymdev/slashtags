# Demos

> Showcase slashtags features and their implementation modules in a fully functional application code

## Requirements
1. Cloned Slashtags Repository
2. NodeJS v14

## Testing Authentication in Demo

### Setup Backend

```
cd ~/slashtags/demo/auth/service/backend
npm install
npm start # test @ localhost:9000
```

### Setup Frontend
```
cd ~/slashtags/demo/auth/service/frontend
npm install
npm start # test @ localhost:3000
```

### Setup Demo Wallet
__Note:__ This library imports the core `@synonymdev/slashtag-*` packages. Be sure to run `npm link` when using a local version.

```
cd ~/slashtags/demo/auth/wallet
npm install
npm start # test @ localhost:3001
```

