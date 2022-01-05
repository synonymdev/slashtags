import { Template } from '../containers/Template';
import { useContext } from 'react';
import { StoreContext, types } from '../store';

export const ScanQRPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const pasteClipboard = async () => {
    const actions = await store.dependencies.actions;

    const clipboard = await navigator.clipboard.readText();
    navigator.clipboard.writeText(clipboard);

    if (clipboard) {
      await actions.handle(
        clipboard,
        {
          /** @type {import ('@synonymdev/slashtags-actions').ACT1_Callbacks} */
          ACT1: {
            onResponse: async (remotePeer) => {
              return new Promise((resolve) => {
                dispatch({
                  type: types.SET_PROMPT,
                  prompt: { type: 'login', resolve, data: remotePeer },
                });
              });
            },
            onSuccess: (connection) => {
              dispatch({
                type: types.ADD_CONNECTION,
                connection,
              });
            },
          },
        },
        (error) => {
          console.log(error);
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
