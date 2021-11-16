import { Template } from '../containers/Template';
import { useContext, useRef, useEffect, useState } from 'react';
import { StoreContext, types } from '../strore';
import QRCode from 'qrcode';
import * as SlashtagsURL from '@synonymdev/slashtags-url';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { truncateMid } from '../utils';

SlashtagsURL.addAction({
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Slashtag Contacts Payload',
  description: "Action's Payload for Slashtags contacts enabled wallets",
  type: 'object',
  properties: {
    title: {
      title: 'Title',
      description: "Contact's title",
      type: 'string',
    },
    image: {
      title: 'Image',
      description: "Contact's image",
      type: 'string',
      format: 'uri',
    },
    pubKey: {
      title: 'Publickey',
      description: "Contact's publickey",
      type: 'string',
      contentEncoding: 'base16',
    },
    challenge: {
      title: 'Challenge',
      description: 'Ephemeral challenge random bytes',
      type: 'string',
      contentEncoding: 'base16',
    },
  },
  additionalProperties: false,
  required: ['title', 'image', 'pubKey', 'challenge'],
});

export const Contacts = () => {
  const { store, dispatch } = useContext(StoreContext);

  return (
    <Template title={'Contacts'}>
      {store.contacts?.length > 0 ? (
        <ul className="accounts-list">
          {store.contacts?.map((account) => (
            <li key={account.pk}>
              <button className="card login" onClick={() => {}}>
                <img className="pp" src={account.image}></img>
                <div className="right">
                  <h2>{account.title}</h2>
                  <pre>{truncateMid(account.pk)}</pre>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>You don't have any contacts yet</div>
      )}
      <footer>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'qr' });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <rect x="336" y="336" width="80" height="80" rx="8" ry="8" />
            <rect x="272" y="272" width="64" height="64" rx="8" ry="8" />
            <rect x="416" y="416" width="64" height="64" rx="8" ry="8" />
            <rect x="432" y="272" width="48" height="48" rx="8" ry="8" />
            <rect x="272" y="432" width="48" height="48" rx="8" ry="8" />
            <path d="M448 32H304a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8zM208 32H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8zm32 104H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V304a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8z" />
          </svg>
        </button>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'add-contact' });
          }}
        >
          <svg viewBox="0 0 22 21" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.0952 7.47949C20.854 7.47949 21.2642 7.05908 21.2642 6.29004V3.81885C21.2642 1.55273 20.0542 0.342773 17.7676 0.342773H15.2964C14.5273 0.342773 14.1069 0.763184 14.1069 1.52197C14.1069 2.27051 14.5273 2.69092 15.2964 2.69092H17.5522C18.4341 2.69092 18.9263 3.14209 18.9263 4.06494V6.29004C18.9263 7.05908 19.3364 7.47949 20.0952 7.47949ZM1.90479 7.47949C2.67383 7.47949 3.08398 7.05908 3.08398 6.29004V4.06494C3.08398 3.14209 3.55566 2.69092 4.44775 2.69092H6.71387C7.48291 2.69092 7.89307 2.27051 7.89307 1.52197C7.89307 0.763184 7.48291 0.342773 6.71387 0.342773H4.23242C1.95605 0.342773 0.73584 1.55273 0.73584 3.81885V6.29004C0.73584 7.05908 1.15625 7.47949 1.90479 7.47949ZM4.23242 20.8813H6.71387C7.48291 20.8813 7.89307 20.4609 7.89307 19.7021C7.89307 18.9434 7.47266 18.5332 6.71387 18.5332H4.44775C3.55566 18.5332 3.08398 18.082 3.08398 17.1489V14.9341C3.08398 14.165 2.66357 13.7446 1.90479 13.7446C1.146 13.7446 0.73584 14.165 0.73584 14.9341V17.4053C0.73584 19.6714 1.95605 20.8813 4.23242 20.8813ZM15.2964 20.8813H17.7676C20.0542 20.8813 21.2642 19.6611 21.2642 17.4053V14.9341C21.2642 14.165 20.854 13.7446 20.0952 13.7446C19.3364 13.7446 18.9263 14.165 18.9263 14.9341V17.1489C18.9263 18.082 18.4341 18.5332 17.5522 18.5332H15.2964C14.5273 18.5332 14.1069 18.9434 14.1069 19.7021C14.1069 20.4609 14.5273 20.8813 15.2964 20.8813Z" />
          </svg>
        </button>
      </footer>
    </Template>
  );
};

export const QR = () => {
  const { store, dispatch } = useContext(StoreContext);
  const canvasRef = useRef();

  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const minutes = 2;

  useEffect(() => {
    const _challenge = store.auth.responder
      .newChallenge(minutes * 60 * 1000)
      .toString('hex');

    const _url = SlashtagsURL.format(
      'b2iaqaamaaqjcbk4q5etm7qfk4g6wbcceckfuzmv57s2qidhq5gmhq6gqagfxnuf3',
      {
        title: store.user.title,
        image: store.user.image,
        pubKey: store.user.pk,
        challenge: _challenge,
      },
    );

    setUrl(_url);

    QRCode.toCanvas(canvasRef.current, _url, {
      margin: 2,
      scale: 8,
      color: {
        dark: '#101010',
        light: '#fff',
      },
    });
    dispatch({
      type: types.EXPECT_CONTACT,
      url: _url,
      addStep: (payload) => {
        dispatch({
          type: types.SET_CONNECTING_STEP,
          ...payload,
        });
      },
      complete: (peer) => {
        dispatch({
          type: types.ADD_TO_CONTACTS,
          peer,
        });
      },
    });
  }, []);

  return (
    <Template title={'Challenge contact'}>
      <div
        className="qr-code"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
      >
        {copied ? <h3>Action url copied</h3> : <h3>Click to copy</h3>}
        <canvas className="btn" ref={canvasRef} />
        <CountdownCircleTimer
          isPlaying
          duration={minutes * 60}
          size={50}
          strokeWidth={4}
          colors={[
            ['#004777', 0.33],
            ['#F7B801', 0.33],
            ['#A30000', 0.33],
          ]}
        >
          {({ remainingTime }) => remainingTime}
        </CountdownCircleTimer>
        <pre>{url}</pre>
      </div>
      <footer>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'contacts' });
          }}
        >
          <svg
            className="flip-h"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-1 -2 7 15"
          >
            <path d="M.823 0A.8.8 0 0 0 0 .811c0 .232.098.428.241.58L5.006 6 .241 10.61a.854.854 0 0 0-.241.579.8.8 0 0 0 .823.811c.232 0 .429-.08.58-.232l5.347-5.18C6.92 6.428 7 6.223 7 6c0-.223-.08-.42-.25-.588L1.404.24A.77.77 0 0 0 .823 0Z" />
          </svg>
        </button>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'add-contact' });
          }}
        >
          <svg viewBox="0 0 22 21" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.0952 7.47949C20.854 7.47949 21.2642 7.05908 21.2642 6.29004V3.81885C21.2642 1.55273 20.0542 0.342773 17.7676 0.342773H15.2964C14.5273 0.342773 14.1069 0.763184 14.1069 1.52197C14.1069 2.27051 14.5273 2.69092 15.2964 2.69092H17.5522C18.4341 2.69092 18.9263 3.14209 18.9263 4.06494V6.29004C18.9263 7.05908 19.3364 7.47949 20.0952 7.47949ZM1.90479 7.47949C2.67383 7.47949 3.08398 7.05908 3.08398 6.29004V4.06494C3.08398 3.14209 3.55566 2.69092 4.44775 2.69092H6.71387C7.48291 2.69092 7.89307 2.27051 7.89307 1.52197C7.89307 0.763184 7.48291 0.342773 6.71387 0.342773H4.23242C1.95605 0.342773 0.73584 1.55273 0.73584 3.81885V6.29004C0.73584 7.05908 1.15625 7.47949 1.90479 7.47949ZM4.23242 20.8813H6.71387C7.48291 20.8813 7.89307 20.4609 7.89307 19.7021C7.89307 18.9434 7.47266 18.5332 6.71387 18.5332H4.44775C3.55566 18.5332 3.08398 18.082 3.08398 17.1489V14.9341C3.08398 14.165 2.66357 13.7446 1.90479 13.7446C1.146 13.7446 0.73584 14.165 0.73584 14.9341V17.4053C0.73584 19.6714 1.95605 20.8813 4.23242 20.8813ZM15.2964 20.8813H17.7676C20.0542 20.8813 21.2642 19.6611 21.2642 17.4053V14.9341C21.2642 14.165 20.854 13.7446 20.0952 13.7446C19.3364 13.7446 18.9263 14.165 18.9263 14.9341V17.1489C18.9263 18.082 18.4341 18.5332 17.5522 18.5332H15.2964C14.5273 18.5332 14.1069 18.9434 14.1069 19.7021C14.1069 20.4609 14.5273 20.8813 15.2964 20.8813Z" />
          </svg>
        </button>
      </footer>
    </Template>
  );
};

export const AddContact = () => {
  const { store, dispatch } = useContext(StoreContext);
  return (
    <Template title={'Authorize contact'}>
      <form className="form-scan">
        <h3>click to paste url</h3>
        <div
          id="topic"
          onClick={async (e) => {
            e.preventDefault();

            const url = await navigator.clipboard.readText();
            if (url.length === 0) return;

            dispatch({
              type: types.ADD_CONTACT,
              url: url,
              addStep: (payload) => {
                dispatch({
                  type: types.SET_CONNECTING_STEP,
                  ...payload,
                });
              },
              complete: (peer) => {
                dispatch({
                  type: types.ADD_TO_CONTACTS,
                  peer,
                });
              },
            });
          }}
        />
      </form>

      <footer>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'contacts' });
          }}
        >
          <svg
            className="flip-h"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-1 -2 7 15"
          >
            <path d="M.823 0A.8.8 0 0 0 0 .811c0 .232.098.428.241.58L5.006 6 .241 10.61a.854.854 0 0 0-.241.579.8.8 0 0 0 .823.811c.232 0 .429-.08.58-.232l5.347-5.18C6.92 6.428 7 6.223 7 6c0-.223-.08-.42-.25-.588L1.404.24A.77.77 0 0 0 .823 0Z" />
          </svg>
        </button>
        <button
          className="btn"
          onClick={() => {
            dispatch({ type: types.SET_VIEW, view: 'qr' });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <rect x="336" y="336" width="80" height="80" rx="8" ry="8" />
            <rect x="272" y="272" width="64" height="64" rx="8" ry="8" />
            <rect x="416" y="416" width="64" height="64" rx="8" ry="8" />
            <rect x="432" y="272" width="48" height="48" rx="8" ry="8" />
            <rect x="272" y="432" width="48" height="48" rx="8" ry="8" />
            <path d="M448 32H304a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8zM208 32H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8zm32 104H64a32 32 0 0 0-32 32v144a32 32 0 0 0 32 32h144a32 32 0 0 0 32-32V304a32 32 0 0 0-32-32zm-32 136a8 8 0 0 1-8 8h-64a8 8 0 0 1-8-8v-64a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8z" />
          </svg>
        </button>
      </footer>
    </Template>
  );
};
