import { useContext } from 'react';
import { StoreContext } from '../store';
import { ScanQRPage } from '../pages/ScanQR';
import { Home } from '../pages/Home';
import { Modal } from './Modal';
import { Error } from './Error';
import { FeedsPage } from '../pages/Feeds';
import { PersonasPage } from '../pages/Personas';

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
            return <PersonasPage />;
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
