// Client side code
import * as SlashtagsURL from '@synonymdev/slashtags-url';

const ws = new WebSocket('ws://localhost:9000');

export const sendInitialRequest = async (handleAuthed, setQR) => {
  // Ask the server for a challenge.
  ws.send(JSON.stringify({ type: 'login' }));

  ws.onmessage = (msg) => {
    msg = JSON.parse(msg.data);

    if (msg.type === 'challenge') {
      const slashtagsAction = SlashtagsURL.format(
        'b2iaqaamaaqjcbw5htiftuksya3xkgxzzhrqwz4qtk6oxn7u74l23t2fthlnx3ked',
        {
          remotePK: msg.publicKey,
          challenge: msg.challenge,
          cbURL: 'http://localhost:9090/answer/',
        },
      );

      setQR(slashtagsAction);
    } else if (msg.type === 'authed') {
      // Store an actual JWT and send it along next requests.
      handleAuthed(msg.token);
    } else if (msg.type === 'Begone!') {
      handleAuthed(msg);
    }
  };
};
