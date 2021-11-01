// @ts-nocheck
import { Browser } from '../components/Browser';
import { useState, useContext, useEffect } from 'react';
import { getTiceket, StoreContext, types } from '../strore';
import Form from '@rjsf/core';
import { LoginForm } from '../components/LoginForm';
import { ArrowSVG } from '../components/ArrowSVG';
import { anonImage } from '../constants';
import { truncateMid } from '../utils';

export const Website = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const [qrURL, setQRURL] = useState('');

  const { store, dispatch } = useContext(StoreContext);

  const handleLogin = () => {
    setOpenLogin(!openLogin);
    if (store.loginURL) return;
    getTiceket(dispatch);
  };

  useEffect(() => {
    if (!qrURL) setQRURL(store.loginURL);
  }, [store.loginURL, qrURL]);

  const account = Object.values(store.accounts || {})[0];

  return (
    <Browser>
      <div className="website">
        <div className="header">
          <div className="logo">
            <svg
              width="25"
              height="25"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.49996 0.888367H11.2099L6.2716 19.1008H0.561646L5.49996 0.888367ZM19.6205 0.888367L14.6822 19.1008H8.97223L13.9106 0.888367H19.6205Z"
                fill="#f7931a"
              />
            </svg>
            <h1>Slashtags</h1>
          </div>

          {store.user ? (
            <div className="user">
              <div className="left">
                <p>{store.user.metadata?.name || 'Anon...'}</p>
                <p>{truncateMid(store.user.publicKey, 4)}</p>
              </div>
              <img alt="" src={store.user.metadata?.image || anonImage}></img>
            </div>
          ) : (
            <div className="login">
              <button onClick={handleLogin}>Login</button>
              {openLogin && <LoginForm qrURL={qrURL} />}
            </div>
          )}
        </div>

        {!store.user && <ArrowSVG />}
        <div className="main-title">
          {store.user ? (
            <p>
              Successfully logged in
              <br />
              <b>
                {store.user.metadata?.name ? (
                  <>
                    <span>as </span>
                    <span className="orange">{store.user.metadata.name}</span>
                  </>
                ) : (
                  <span> Anonymously </span>
                )}
                🎉
              </b>
              <br />
              <span style={{ fontSize: '.8em' }}>
                Check your wallet for feeds
              </span>
              <br />
              <button
                className="btn logout"
                onClick={() => window.location.reload(true)}
              >
                Logout
              </button>
            </p>
          ) : (
            <p>
              Hello there <br />
              <span style={{ fontSize: '1.5em' }}>
                Welcome to <span className="orange">Slashtags</span>
              </span>
              <br /> login with your <span className="orange">Bitcoin</span>
              <span className="orange"> publicKey</span>.
            </p>
          )}
        </div>
      </div>
    </Browser>
  );
};
