import { Template } from '../containers/Template';
import { RPC } from '@synonymdev/slashtags-rpc';
import { Actions } from '@synonymdev/slashtags-actions';
import { useContext } from 'react';
import { StoreContext, types } from '../store';

export const ScanQRPage = () => {
  const { dispatch } = useContext(StoreContext);

  let actions;

  const pasteClipboard = async () => {
    if (!actions) {
      const node = await RPC({ relays: ['ws://testnet3.hyperdht.org:8910'] });
      actions = Actions(node);
    }

    const clipboard = await navigator.clipboard.readText();
    navigator.clipboard.writeText(clipboard);

    if (clipboard) {
      await actions.handle(
        clipboard,
        {
          /** @type {import ('@synonymdev/slashtags-actions').ACT1_Callbacks} */
          ACT1: {
            onRemoteVerified: async (peer) => {
              return new Promise((resolve) => {
                dispatch({
                  type: types.SET_PROMPT,
                  prompt: { type: 'login', resolve, data: peer },
                });
              });
            },
            onLocalVerified: ({ local, remote }) => {
              dispatch({
                type: types.ADD_ACCOUNT,
                account: {
                  service: remote,
                  profile: local,
                },
              });
            },
          },
        },
        (error) => {
          dispatch({
            type: types.SET_PROMPT,
            prompt: { type: 'error', error: error.message || error.code },
          });
        },
      );
    }
  };

  return (
    <Template back={true} scan={false}>
      <div className="scan-box"></div>

      <p className="paste-clipboard">
        Scan the QR code above or:{' '}
        <button onClick={pasteClipboard}>+ Paste from clipboard</button>
      </p>
    </Template>
  );
};
