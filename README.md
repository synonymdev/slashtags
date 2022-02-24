# Slashtags MVP

A monorepo containing Javascript packages for different Slashtags modules.

> A practical and gradual exploration of Slashtags protocol design, through a mvp implementation.

## ⚠️ Warning

This is pre-alpha software. Please use at your own risk. Expect breaking changes on minor releases.

## How Slashtags works

Slashtags can be logically split into 4 parts: a user wallet, a service frontend and backend, and a relay.

### User Wallet
Demo URL: https://slashtags-wallet.netlify.app/

The slashtags wallet, owned by *users* allows creation of one or more profiles from a private key. The profiles can then be shared with other services. You choose what profile you want to share with a given service, therefore have full control over the information you provide. Profiles can be used across multiple services, allowing the creation of a web of trust.

Once a profile is chosen for a specific login request, the login request is signed using the wallet's private key and profile, and sent to one or more relays.

### Service Frontend
Demo URL: https://slashtags.netlify.app/

Users log into a *service* frontend by scanning (or copying) a QR code provided by the *service* with their *wallet*. Once scanned, the user selects their profile and logs into the service. The service frontend requests this QR code from the service backend.

A simple example of a frontend service is the twitter website. Developers will need to integrate slashtags login into their frontend.

### Service Backend
The service backend generates slashtag URLs. The URL generated contains two main parts: a unique, one time use code (to associate with the request from the frontend) and a schema, defining what information is required in order to interact with the *service*.

The backend listens to relay events and therefore knows when a wallet has logged in with a specific profile.

A simple example of a backend service is the twitter backend.
Developers will need to integrate slashtags login into their backend.

### Relay
DHT relays allows communication between a slashtags wallet and backend services, enabling the login flow.

## Usage

### Getting started

Currently the best way to get familiar with the existing features is to check the [Demos](./demo/README.md).

### Development

Make sure all packages build and pass tests successfully:

```
npm run full-check
```

[nvm](https://github.com/nvm-sh/nvm#intro) is suppported but not required

### Adding new package

TODO: write documentation for all steps needed for adding new package
