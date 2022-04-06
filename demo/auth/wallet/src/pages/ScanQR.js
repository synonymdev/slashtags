import { Template } from '../containers/Template';
import { useContext, useState } from 'react';
import { StoreContext, types } from '../store';
import { Sheet } from '../components/Sheet';
import { Card } from '../components/Card';

import { SDK } from '../../../../../packages/sdk/src';

export const ScanQRPage = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [isVisible, setIsVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [url, setURL] = useState(null);

  const cancel = () => {
    setIsVisible(false);
    setProfile(null);
    setURL(null);
  };

  const submitLogin = async () => {
    const auth = await state.auth;
    auth.request(url);
  };

  const submitContact = async () => {
    dispatch({ type: types.ADD_CONTACT, contact: { profile } });
  };

  const pasteClipboard = async () => {
    const clipboard = await navigator.clipboard.readText();
    navigator.clipboard.writeText(clipboard);

    let parsed;
    try {
      parsed = SDK.parseURL(clipboard);
      setURL(clipboard);
    } catch (error) {
      alert(`"${clipboard}" is not a valid URL`);
      return;
    }

    const sdk = await state.sdk;
    const remote = sdk.slashtag({ url: clipboard });
    try {
      await remote.ready();
    } catch (error) {
      alert(error.message);
    }

    const profile = await remote.getProfile();
    if (!profile) alert('No profile found');
    setProfile(profile);
    setIsVisible(true);

    switch (parsed.protocol) {
      case 'slashauth':
        const auth = await state.auth;
        auth.on('error', (error) => {
          alert(error);
        });

        auth.on('success', () => {
          dispatch({ type: types.ADD_ACCOUNT, account: { profile } });
        });
        return;
      case 'slash':
        return;
      default:
        return;
    }
  };

  return (
    <Template back={true} scan={false}>
      <div className="scan-box"></div>

      <p className="paste-clipboard">
        Scan the QR code above or:{' '}
        <button onClick={pasteClipboard}>+ Paste from clipboard</button>
      </p>
      <Sheet isVisible={isVisible}>
        {(() => {
          switch (url && SDK.parseURL(url).protocol) {
            case 'slashauth':
              return (
                <div className="login-modal">
                  <h1>Sign in with slashtags to</h1>
                  <Card profile={profile} />
                  <div className="footer">
                    <button className="cancel btn" onClick={cancel}>
                      Cancel
                    </button>
                    <button
                      className="submit  btn primary"
                      onClick={submitLogin}
                    >
                      Login
                    </button>
                  </div>
                </div>
              );
            case 'slash':
              return (
                <div className="login-modal">
                  <h1>Sign in with slashtags to</h1>
                  <Card profile={profile} />
                  <div className="footer">
                    <button className="cancel btn" onClick={cancel}>
                      Cancel
                    </button>
                    <button
                      className="submit  btn primary"
                      onClick={submitContact}
                    >
                      Add contact
                    </button>
                  </div>
                </div>
              );
            default:
              return <></>;
          }
        })()}
      </Sheet>
    </Template>
  );
};
