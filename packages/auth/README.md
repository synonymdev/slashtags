# SlashAuth

> Authorization using Slashtags

## Install

```bash
npm i @synonymdev/slashtags-sdk @synonymdev/slashtags-auth
```

## Usage

### Wallet side

```javascript
import { SDK } from '@synonymdev/slashtags-sdk';
import { SlashAuth } from '@synonymdev/slashtags-auth';

const sdk = await SDK.init({ seed: '<32 bytes seed>' });

// Create a Slashtag
const slashtag = sdk.slashtag({ name: 'foo' });
await slashtag.ready();

// Setup local profile
await slashtag.setProfile({
  name: 'Alice',
});

// Setup auth
const auth = slashtag.registerProtocol(SlashAuth);

// On getting a slashauth:// url
const serverSlashtag = sdk.slashtag({ url: url });
await serverSlashtag.ready();

// Get the server's profile
const profile = await serverSlashtag.getProfile();

auth.on('error', (error) => {
  // Error
});

auth.on('success', () => {
  // Success
});

// Connect to the server and send the token in the url `?q=<token>`
auth.request(url);
```

### Server side

```javascript
import { SDK } from '@synonymdev/slashtags-sdk';
import { SlashAuth } from '@synonymdev/slashtags-auth';

const sdk = await SDK.init({ seed: '<32 bytes seed>' });
const slashtag = sdk.slashtag({ name: 'foo' });
await slashtag.ready();

await slashtag.setProfile({
  name: 'Bitfinex',
});

const auth = slashtag.registerProtocol(SlashAuth);

auth.on('request', async (request, response) => {
  let remoteProfile;

  try {
    // Try resolving user's profile from their Slashtag
    const remoteSlashtag = request.peerInfo.slashtag;
    await remoteSlashtag.ready();
    remoteProfile = await remoteSlashtag.getProfile();
  } catch {
    response.error(
      new Error('Could not resolve your profile ... can not sign in'),
    );
    return;
  }

  try {
    authorize(request.token, remoteProfile);
    response.success();
  } catch (e) {
    response.error(e.message);
  }
});

// Listen on the Slashtag.key
await auth.listen();

function authorize(token, remoteProfile) {
  // Check the token against server's sessions, clientIDs, etc.
  // Check if the user is already registered, blocked, etc.
}

// Generate a slashauth:// url for clients, sessions etc. and pass it to the user as QR
SlashAuth.formatURL(slashtag.url, clientID);
```
