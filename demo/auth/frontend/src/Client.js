// @ts-nocheck
// Client side code starts here
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

const ws = new WebSocket('ws://localhost:9000');

export const sendInitialRequest = async (handleAuthed, setQR) => {
  ws.send(JSON.stringify({ type: 'login' }));

  ws.onmessage = (msg) => {
    msg = JSON.parse(msg.data);

    if (msg.type === 'challenge') {
      const slashtagsAction = SlashtagsURL.format(
        'b2iaqaamaaqjcaxryobe4ygqqs3cksu74j4rhzpr7kk3lndqg7gim72edpiagor3z',
        {
          title: 'Bitfinex',
          image:
            'https://pbs.twimg.com/profile_images/1365263904948051968/Zln4ecyb_400x400.png',
          pubKey: msg.publicKey,
          challenge: msg.challenge,
          cbURL: 'http://localhost:9090/response/',
        },
      );

      setQR(slashtagsAction);
    } else {
      handleAuthed(msg);
    }
  };
};

export const Client = ({ setWallet, sendAction }) => {
  const [user, setUser] = useState();
  const [action, setAction] = useState();
  const canvasRef = useRef();

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) setUser(JSON.parse(user));
    } catch (error) {}
  }, []);

  const handleAuthed = (msg) => {
    if (msg.type === 'authed') {
      const user = msg.user;

      if (!user) return;
      setUser(user);
      setAction(null);
      localStorage.setItem('user', JSON.stringify(user));
    } else if (msg.type === 'Begone!') {
      setUser({ blocked: true, ...user });
    }
  };

  const setQR = (url) => {
    setAction(url);
    QRCode.toCanvas(canvasRef.current, url);
  };

  const signOut = () => {
    setUser(null);
    setAction(null);
    localStorage.removeItem('user');
  };

  return (
    <div className="container">
      <h1>Client</h1>
      <div id="client">
        {user ? (
          <>
            {user.blocked ? (
              <>
                <p>YOU ARE BLOCKED</p>
                <br />
                <p>Begone!</p>
                <p>{user.publickey}</p>
                <br />{' '}
                <button className="btn" onClick={signOut}>
                  Back
                </button>
              </>
            ) : (
              <>
                <p>
                  Welcome{' '}
                  <b>{user?.name ? user.name : 'nameless person yet'}</b>
                </p>
                <br />
                <p>you are signed in with public key: </p>
                <pre>{user?.publicKey}</pre>
                <br />{' '}
                <button className="btn" onClick={signOut}>
                  Sign out
                </button>
              </>
            )}
          </>
        ) : action ? (
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
                setWallet('Hal Finney');
                sendInitialRequest(handleAuthed, setQR);
              }}
            >
              Sign in (existing user)
            </button>
            <button
              className="btn signin"
              onClick={() => {
                setWallet('John Carvalho');
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
