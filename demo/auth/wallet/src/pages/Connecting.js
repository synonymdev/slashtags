import { useContext } from 'react';
import { StoreContext, types } from '../store';
import { Template } from '../containers/Template';

export const Connecting = () => {
  const { store, dispatch } = useContext(StoreContext);

  const state = store.connecting;

  return (
    <Template title={'Connecting'}>
      <div className="connecting">
        {state.initiator
          ? (() => {
              switch (state.step) {
                case 0:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                    </>
                  );
                  break;
                case 1:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                    </>
                  );
                  break;
                case 2:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                      <div>verified {state.pk}</div>
                    </>
                  );
                case 3:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                      <div>verified {state.pk}</div>
                      <div>verified by {state.pk} too</div>
                      <b>Successfully verified</b>
                    </>
                  );
                default:
                  return <></>;
              }
            })()
          : (() => {
              switch (state.step) {
                case 0:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                    </>
                  );
                  break;
                case 1:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                    </>
                  );
                  break;
                case 2:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                      <div>verified {state.pk}</div>
                    </>
                  );
                case 3:
                  return (
                    <>
                      <div>connected to {state.pk}</div>
                      <div>verifying {state.pk}</div>
                      <div>verified {state.pk}</div>
                      <div>verified by {state.pk} too</div>
                      <b>Successfully verified</b>
                    </>
                  );

                default:
                  return <></>;
              }
            })()}
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
      </footer>
    </Template>
  );
};
