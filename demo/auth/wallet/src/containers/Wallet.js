import { useContext } from 'react';
import { StoreContext } from '../store';
import { ScanQRPage } from '../pages/ScanQR';
import { ProfilesPage } from '../pages/Profiles';
import { Home } from '../pages/Home';
import { Modal } from './Modal';
import { Error } from './Error';
import { FeedsPage } from '../pages/Feeds';

export const Wallet = () => {
  const { store } = useContext(StoreContext);

  return (
    <div className="wallet">
      {(() => {
        switch (store.view) {
          case 'home':
            return <Home />;
          case 'scanQR':
            return <ScanQRPage />;
          case 'profiles':
            return <ProfilesPage />;
          case 'account':
            return <FeedsPage />;
          default:
            return <Home />;
        }
      })()}
      <Modal />
      <Error />
    </div>
  );
};
