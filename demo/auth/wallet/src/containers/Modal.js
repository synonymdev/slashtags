import { useContext, useState } from 'react';
import { StoreContext, types } from '../strore';
import { Sheet } from '../components/Sheet';
import { Card } from '../components/Card';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';

const anonymous = (publicKey) => {
  if (!publicKey) return;
  return {
    keyPair: curve.generateSeedKeyPair(publicKey),
    metadata: null,
  };
};

const Login = ({ data, cancel, resolve }) => {
  const [anon, setAnon] = useState(true);
  const [profile, setProfile] = useState(anonymous(data.publicKey));
  const { store, dispatch } = useContext(StoreContext);

  const submit = () => {
    resolve(profile);
  };

  return (
    <div className="login-modal">
      <h1>Login to</h1>
      <Card publicKey={data.publicKey} metadata={data.metadata} />

      <div className="switch">
        <button
          onClick={() => {
            setAnon(true);
            setProfile(anonymous(data.publicKey));
          }}
          className={'btn ' + (anon ? 'active' : '')}
        >
          Anonymously
        </button>
        <button
          onClick={() => {
            setAnon(false);
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
        store.profiles.map((profile) => {
          return (
            <button key={profile.publicKey} onClick={() => setProfile(profile)}>
              <Card
                publicKey={Buffer.from(profile.keyPair.publicKey).toString(
                  'hex',
                )}
                metadata={profile.metadata}
              ></Card>
            </button>
          );
        })}

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
