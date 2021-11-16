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
      try {
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
            onSuccess: ({ responder, initiator }) => {
              dispatch({
                type: types.ADD_ACCOUNT,
                account: {
                  service: {
                    publicKey: Buffer.from(responder.publicKey).toString('hex'),
                    metadata: responder.metadata,
                  },
                  profile: {
                    publicKey: Buffer.from(initiator.publicKey).toString('hex'),
                    metadata: initiator.metadata,
                  },
                },
              });
            },
            onError: (error) => {
              console.log('got error');
              dispatch({
                type: types.SET_PROMPT,
                prompt: { type: 'error', error: error.message },
              });
            },
          },
        });

        console.log('Result', result);
      } catch (error) {
        dispatch({
          type: types.SET_PROMPT,
          prompt: {
            type: 'error',
            error: `Something went wrong, couldn't parse QR: "${clipboard}"`,
          },
        });
      }
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
