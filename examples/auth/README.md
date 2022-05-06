# Slashtags Auth Demo

Demonstrate the implementation of Slashtags features between a Responder, and an Initiator.

## usage

- Run responder's server

```
npm run listen
```

You should see the responder's Auth url, and it will be saved at `/slashtags-examples/auth/url.txt` in your operating system's temporary directory alongside the data of the SlashDrives.

- Run the Initiator's client (in a separate terminal)

```bash
npm run request
```

It should resolves the Responder's profile, and ask you to click any key to continue.

Wait until the `listen` scripts resolves the Initiator's profile too before closing the terminal.

## Testing

You can use this example to test the implementation of the SlashAuth in your wallet or Server.

- For testing your implementation of the Initiator side, run `npm run listen` in a separate terminal, copy the resulting Auth URL and pass it to your implementation.

- For testing your implementation of the Responder side, pass the Auth URL to the `request` script as follows:

```
url=<your_auth_url> npm run request
```
