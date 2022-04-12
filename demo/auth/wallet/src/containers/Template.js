import { useContext, useEffect, useState } from 'react';
import { StoreContext, types } from '../store';
import { Jdenticon } from '../components/identicon.js';

const BackButton = () => {
  const { dispatch } = useContext(StoreContext);

  return (
    <div
      className="back-button"
      onClick={() => dispatch({ type: types.SET_VIEW, view: 'home' })}
    >
      <svg
        width="16"
        height="14"
        viewBox="0 0 16 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 7.98592H3.8L8.5 12.6197L7.1 14L0 7L7.1 0L8.5 1.38028L3.8 6.01408H16V7.98592Z"
          fill="#636366"
        />
      </svg>
    </div>
  );
};

export const Template = ({ title, back = false, children = null }) => {
  const { state, dispatch } = useContext(StoreContext);

  useEffect(() => {
    if (state.profile) return;

    (async () => {
      const currentUser = await state.currentUser;
      const profile = await currentUser.getProfile();

      dispatch({
        type: types.SET_PROFILE,
        profile,
      });
    })();
  }, [state.currentUser]);

  return (
    <>
      <header className="header">
        <div className="left">
          {back ? <BackButton /> : <h1 className="title">{title}</h1>}
        </div>
        <nav className="right">
          <button
            className="top-right-button"
            onClick={() => dispatch({ type: types.SET_VIEW, view: 'profile' })}
          >
            {state.profile?.image ? (
              <img className="image" src={state.profile?.image}></img>
            ) : (
              <Jdenticon
                className="image"
                value={state.profile?.id}
              ></Jdenticon>
            )}
          </button>
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
};
