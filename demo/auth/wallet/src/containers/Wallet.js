import { useContext } from 'react';
import { StoreContext } from '../strore';
import { QR, Contacts, AddContact } from '../pages/Contacts';
import { Connecting } from '../pages/Connecting';
import { Home } from '../pages/Home';

export const Wallet = () => {
  const { store } = useContext(StoreContext);

  return (
    <div className="wallet">
      {(() => {
        switch (store.view) {
          case 'home':
            return <Home />;
          case 'contacts':
            return <Contacts />;
          case 'qr':
            return <QR />;
          case 'add-contact':
            return <AddContact />;
          case 'connecting':
            return <Connecting />;
          default:
            return <Home />;
        }
      })()}
    </div>
  );
};
