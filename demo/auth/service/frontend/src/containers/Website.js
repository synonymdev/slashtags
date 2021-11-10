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
              width="30"
              height="30"
              viewBox="0 0 106 106"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M42.4686 31.981H55.5435L44.2536 73.9277H31.1787L42.4686 31.981ZM74.8212 31.981L63.5312 73.9277H50.4564L61.7463 31.981H74.8212Z"
                fill="white"
              />
              <path
                d="M58.578 0.298837C87.7176 3.37791 108.78 29.4831 105.701 58.578C102.622 87.7176 76.5169 108.78 47.422 105.701C18.2824 102.622 -2.78023 76.5169 0.298837 47.422C3.37791 18.2824 29.4831 -2.78023 58.578 0.298837ZM57.4178 11.3656C34.5256 8.9113 13.7753 25.69 11.3656 48.5822C8.9113 71.4744 25.69 92.2247 48.5822 94.6344C71.4744 97.0887 92.2247 80.31 94.6344 57.4178C97.0887 34.5256 80.31 13.7753 57.4178 11.3656Z"
                fill="#F50"
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
