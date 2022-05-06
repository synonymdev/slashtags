import b4a from 'b4a';
import { SDK, protocols } from '@synonymdev/slashtags-sdk';
import fs from 'fs';

listen();

async function listen() {
  // Start setup
  const sdk = await SDK.init({
    storage: './tmp/store/responder/',
    primaryKey: b4a.from('a'.repeat(64), 'hex'),
  });

  // Create a new Slashtag from a name
  const responder = sdk.slashtag({ name: 'Responder' });

  // Set the responder's profile on their public drive
  await responder.setProfile({
    id: responder.url.toString(),
    type: 'Organization',
    name: 'Synonym',
    url: 'www.synonym.to',
    description: 'Web of trust for all',
  });
  // End of setup

  // SlashAuth protocol is already available on the initiator (included in the SDK)
  // And we can access its instance from anywhere on the initiator as follows:
  const auth = responder.protocol(protocols.SlashAuth);

  auth.on('request', async (request, response) => {
    try {
      console.log(
        `\n\n\n\n\n\n\n === Success: got request, token: `,
        request.token,
      );

      // Request will include an instance of the initiator's Slashtag for convenience
      const initiator = request.peerInfo.slashtag;
      const initiatorProfile = await initiator.getProfile();

      console.log(
        `\n\n === Resolved Initiator's profile ===`,
        initiatorProfile,
      );

      // Read a message from the initiator on the drive they shared with us
      const sharedByInitiator = await initiator.drive(request.drive);

      console.log(
        "\n === Resolved Initiator's shared drive: === \n",
        '   - /messages/1',
        b4a.toString(await sharedByInitiator.get('messages/1')),
      );

      // Writing a message _to_ the initiator
      const { drive: sharedByResponder } = await response.success();
      if (!(await sharedByResponder.get('messages/1')))
        await sharedByResponder.put(
          'messages/1',
          b4a.from('Hello from Responder === ' + new Date().toISOString()),
        );
    } catch (error) {
      console.log('\n\n === Error === \n', error);
    }
  });

  // Session management is out of SlashAuth scope,
  // so the responder should be providing the token
  // and figure what to do with it once received.
  const authURL = protocols.SlashAuth.formatURL(responder.url, 'FOOBAR');
  console.log('\n\n === SlashAuth URL: \n === ' + authURL);

  // Passing the url to the `request` script
  fs.writeFileSync('./tmp/url.txt', authURL);
}
