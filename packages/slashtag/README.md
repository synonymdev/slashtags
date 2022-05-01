# slashtags-slashtag

## API

#### `const drive = new Slashtag(options)`

Make a new SlashDrive instance.

`options` include:

```js
{
  keyPair: kp, // optionally pass the public key and secret key as a key pair
  keyPair: k, // optionally pass the public key of a remote Slashtag.
  store: store, // corestore@^6.0.0 instance, if not passed, a new instance will be created with ephemeral storage (in memory)
}
```
