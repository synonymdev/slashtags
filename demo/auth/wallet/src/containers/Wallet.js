import { useContext } from 'react';
import { StoreContext } from '../store';
import { Home } from '../pages/Home';
import { Modal } from './Modal';
import { Error } from './Error';
import { ScanQRPage } from '../pages/ScanQR';
import { PersonasPage } from '../pages/Personas';
import { QRPage } from '../pages/QRPage';

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
          case 'personas':
            return <PersonasPage />;
          case 'authQR':
            return <QRPage />;
          default:
            return <Home />;
        }
      })()}
      <Modal />
      <Error />
    </div>
  );
};
