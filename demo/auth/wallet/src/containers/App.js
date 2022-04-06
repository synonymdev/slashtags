import { useReducer } from 'react';
import { initialValue, reducer, StoreContext, types } from '../store';
import { ProfilePage } from '../pages/Profile.js';
import { Home } from '../pages/Home.js';
import { ScanQRPage } from '../pages/ScanQR';

export const App = () => {
  const [state, dispatch] = useReducer(reducer, initialValue);

  return (
    <div className="App">
      <StoreContext.Provider value={{ state, dispatch }}>
        {(() => {
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
        })()}
      </StoreContext.Provider>
    </div>
  );
};
