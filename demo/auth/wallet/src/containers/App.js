import { useEffect, useReducer, useState } from 'react';
import { initialValue, reducer, StoreContext, types } from '../store';
import { ProfilePage } from '../pages/Profile.js';
import { Home } from '../pages/Home.js';
import { ScanQRPage } from '../pages/ScanQR';

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const localStored = localStorage.getItem('profile');
        if (localStored) {
          JSON.parse(localStored);
          setLoading(false);
          return;
        }
      } catch (error) {}

      await state.currentUser;
      setLoading(false);
    })();
  }, [state.currentUser]);

  return (
    <div className="App">
      <StoreContext.Provider value={{ state, dispatch }}>
        {loading ? (
          <Loading />
        ) : (
          (() => {
            switch (state.view) {
              case 'home':
                return <Home />;
              case 'qr':
                return <ScanQRPage />;
              case 'profile':
                return <ProfilePage />;
              default:
                return <Home />;
            }
          })()
        )}
      </StoreContext.Provider>
    </div>
  );
};

function Loading() {
  return (
    <div className="loading-screen">
      Setting up
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
