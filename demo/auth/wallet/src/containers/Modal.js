import { useContext, useState } from 'react';
import { StoreContext, types } from '../store';
import { Sheet } from '../components/Sheet';
import { Card } from '../components/Card';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';
import { didKeyFromPubKey } from '@synonymdev/slashtags-auth';

/** @returns {import ('@synonymdev/slashtags-auth').PeerConfig} */
const anonymous = (seed) => {
  const keyPair = curve.generateSeedKeyPair(seed);
  const id = didKeyFromPubKey(keyPair.publicKey);

  return {
    profile: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': id,
    },
    keyPair,
  };
};

const Login = ({ data, cancel, resolve }) => {
  const [anon, setAnon] = useState(true);
  const [persona, setPersona] = useState(anonymous(data['@id']));
  const { store, dispatch } = useContext(StoreContext);

  /** @param {import ('@synonymdev/slashtags-actions').ACT1_InitialResponseResult} x*/
  const respondToAuth = (x) => resolve(x);

  const submit = () => respondToAuth({ initiator: persona });

  return (
    <div className="login-modal">
      <h1>Login to</h1>
      <Card profile={data} />

      <div className="switch">
        <button
          onClick={() => {
            setAnon(true);
            setPersona(anonymous(data.id));
          }}
          className={'btn ' + (anon ? 'active' : '')}
        >
          Anonymously
        </button>
        <button
          onClick={() => {
            setAnon(false);
            setPersona(store.personas[0]);
          }}
          className={'btn ' + (!anon ? 'active' : '')}
        >
          Profile
        </button>
      </div>
      {anon ? (
        <p className="anon-description">
          Login using unique keyPair derived for this website.
        </p>
      ) : (
        <p className="anon-description">Select an existing profile.</p>
      )}
      {!anon &&
        store.personas.map(
          /** @param {import ('@synonymdev/slashtags-auth').PeerConfig} p*/
          (p, id) => {
            console.log({ p, persona });
            return (
              <Card
                key={p['@id']}
                profile={p.profile}
                className={
                  p.profile['@id'] === persona.profile['@id']
                    ? 'active login-profile'
                    : 'login-profile'
                }
                onClick={() => setPersona(p)}
              ></Card>
            );
          },
        )}

      <div className="footer">
        <button className="cancel btn" onClick={cancel}>
          Cancel
        </button>
        <button className="submit  btn primary" onClick={submit}>
          Login
        </button>
      </div>
    </div>
  );
};

export const Modal = () => {
  const { store, dispatch } = useContext(StoreContext);

  const resolve = store.prompt?.resolve;

  const cancel = (e) => {
    e?.preventDefault();
    dispatch({ type: types.SET_VIEW, view: 'home' });
    dispatch({ type: types.SET_PROMPT, prompt: null });
    resolve(false);
  };

  return (
    <Sheet isVisible={!!resolve}>
      <Login
        data={store.prompt?.data}
        cancel={cancel}
        resolve={resolve}
      ></Login>
    </Sheet>
  );
};
