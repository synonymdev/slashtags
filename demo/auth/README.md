# Slashtags Auth Demo

Demonstrate the implementation of Slashtags features between an application (backend/frontend) on one hand, and a slashtags wallet on the other hand.

## Features

- [x] Slashtags accounts
- [x] Slashtags contacts

## usage

- Setup a testnet

In root directory

```
npm run testnet
```

- Run server

```
cd service/backend/

npm install

npm run dev
```

- Run the website's frontend

```
cd service/frontend/

npm install

npm run start
```

Then visit `http://localhost:8001/`

- Run the demo wallet

```
cd wallet/

npm install

npm run start
```

Then visit `http://localhost:8080/`
