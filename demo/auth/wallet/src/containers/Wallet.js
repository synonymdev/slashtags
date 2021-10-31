import { useContext } from 'react';
import { StoreContext } from '../strore';
import { ScanQRPage } from '../pages/ScanQR';
import { ProfilesPage } from '../pages/Profiles';
import { Home } from '../pages/Home';
import { Modal } from './Modal';

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
          default:
            return <Home />;
        }
      })()}
      <Modal />
    </div>
  );
};
