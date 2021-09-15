// @ts-nocheck
// Client side code starts here
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useRef } from 'react';
import QRCode from 'qrcode';

const ws = new WebSocket('ws://localhost:9000');

export const sendInitialRequest = async (handleAuthed, setQR) => {
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

export const Client = ({ setWallet, sendAction }) => {
  const [user, setUser] = useState();
  const [action, setAction] = useState();
  const canvasRef = useRef();

  const handleAuthed = (token) => {
    console.log('got token ', token);
  };

  const setQR = (url) => {
    setAction(url);
    QRCode.toCanvas(canvasRef.current, url);
  };

  return (
    <div className="container">
      <h1>Client</h1>
      <div id="client">
        {action ? (
          <>
            <canvas
              className="btn"
              ref={canvasRef}
              onClick={() => {
                sendAction(action);
              }}
            />
            <button
              className="go-to-wallet "
              onClick={() => {
                sendAction(action);
              }}
            >
              <pre>{action}</pre>
            </button>
            <button
              className="btn"
              onClick={() => {
                setAction(undefined);
              }}
            >
              {'< back'}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn signin"
              onClick={() => {
                setWallet('Rip Hal!');
                sendInitialRequest(handleAuthed, setQR);
              }}
            >
              Sign in (existing user)
            </button>
            <button
              className="btn signin"
              onClick={() => {
                setWallet('new user');
                sendInitialRequest(handleAuthed, setQR);
              }}
            >
              Sign in (new user)
            </button>
            <button
              className="btn signin"
              onClick={() => {
                setWallet('blocked user');
                sendInitialRequest(handleAuthed, setQR);
              }}
            >
              Sign in (blocked user)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
