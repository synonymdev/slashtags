import b4a from 'b4a';
import { SDK, protocols, SlashURL } from '@synonymdev/slashtags-sdk';
import fs from 'fs';

request();

async function request() {
  console.time('setup');
  // Start setup
  const sdk = await SDK.init({
    persistent: false,
    storage: './tmp/store/initiator/',
    primaryKey: b4a.from('b'.repeat(64), 'hex'),
  });

  // Create a new Slashtag from a name
  const initiator = await sdk.slashtag({ name: 'Initiator' });

  console.log('Initiator:', initiator.url.toString());

  // Set the initiator's profile on their public drive
  await initiator.setProfile({
    id: initiator.url.toString(),
    type: 'Person',
    name: 'Alice Bob',
    url: 'https://alice.bob',
    description: 'Alice is a very good person',
  });
  // End of setup
  console.timeEnd('setup');

  // SlashAuth protocol is already available on the initiator (included in the SDK)
  // And we can access its instance from anywhere on the initiator as follows:
  const auth = initiator.protocol(protocols.SlashAuth);

  // Resolve Remote profile
  console.time('resolve profile');
  const url = process.env.url || fs.readFileSync('./tmp/url.txt', 'utf8');

  const responderProfile = await sdk
    .slashtag({ key: new SlashURL(url).slashtag.key })
    .getProfile();
  console.log(`\n\n === Resolved Responder's profile === \n`, responderProfile);
  console.timeEnd('resolve profile');

  // Making an Auth request
  console.time('auth response');
  const { drive: sharedByMe } = await auth.request(new SlashURL(url));

  console.log('\n\n === Sent a request === \n');

  // Once the Responder has accepted the request, we can access the drive they shared with us
  auth.on('success', async ({ drive }) => {
    console.log(`\n\n === Success: Responder shared a drive === \n`, drive);
    console.timeEnd('auth response');

    console.time('read message');
    const sharedWithMe = await initiator.drive(drive);

    // Reading a message _from_ the responder on the drive they shared with us
    console.log(
      "\n === Resolved Initiator's shared drive: === \n",
      '   - /messages/1',
      b4a.toString(await sharedWithMe.get('messages/1')),
    );
    console.timeEnd('read message');

    // Done, closing the sdk gracefully
    await sdk.close();
  });

  // Writing a message _to_ the responder on the drive we shared with them
  await sharedByMe.put('messages/1', b4a.from('Hello from Initiator'));
}
