import { Template } from '../containers/Template';
import { Core } from '@synonymdev/slashtags-core';
import { SlashtagsActions } from '@synonymdev/slashtags-actions';
import { useContext } from 'react';
import { StoreContext, types } from '../strore';

const slashActs = SlashtagsActions({ node: Core() });

export const ScanQRPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const pasteClipboard = async () => {
    const clipboard = await navigator.clipboard.readText();
    navigator.clipboard.writeText(clipboard);

    if (clipboard) {
      const result = await slashActs.handle(clipboard, {
        ACT_1: {
          onChallenge: async (data) => {
            return new Promise((resolve) => {
              dispatch({
                type: types.SET_PROMPT,
                prompt: { type: 'login', resolve, data },
              });
            });
          },
          onSuccess: ({ responderPK, metadata }) => {
            console.log('success', metadata);
            dispatch({
              type: types.SET_ACCOUNT,
              account: {
                publicKey: Buffer.from(responderPK).toString('hex'),
                metadata,
              },
            });
          },
          onError: (error) => {
            console.log('got error', error);
            dispatch({
              type: types.SET_PROMPT,
              prompt: { type: 'error', error },
            });
          },
        },
      });

      console.log('Result', result);
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
