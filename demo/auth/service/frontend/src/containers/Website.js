// @ts-nocheck
import { Browser } from '../components/Browser';
import { useState, useContext, useEffect } from 'react';
import { getTiceket, StoreContext, types } from '../strore';
import Form from '@rjsf/core';
import { LoginForm } from '../components/LoginForm';

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
            <div
              className="user"
              onClick={() =>
                dispatch({
                  type: types.SET_WEBSITE_VIEW,
                  websiteView: 'Account',
                })
              }
            >
              <img alt="" src={store.user.metadata?.image}></img>
            </div>
          ) : (
            <div className="login">
              <button onClick={handleLogin}>Login</button>
              {openLogin && <LoginForm qrURL={qrURL} />}
            </div>
          )}
        </div>

        {store.websiteView === 'Account' ? (
          <main className="main">
            <h1>Account</h1>
            <Form schema={account.schema} formData={account.data} />
          </main>
        ) : (
          account && (
            <main className="main">
              <h1>Welcome {account.data.accountName}</h1>
              <h2>
                Here are some new items you might like according to your
                favorite tags:
              </h2>
              <ul className="tags">
                {account.data.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="podcast"></div>
              <div className="podcast"></div>
              <div className="podcast"></div>
            </main>
          )
        )}
      </div>
    </Browser>
  );
};
