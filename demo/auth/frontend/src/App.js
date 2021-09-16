// @ts-nocheck
import { Client } from './Client';
import { Wallet, setUser } from './Wallet';
import { useState } from 'react';

export const App = () => {
  const [actionURL, setActionURL] = useState();

  return (
    <>
      <Wallet actionURL={actionURL} />
      <Client setWallet={setUser} sendAction={setActionURL} />
    </>
  );
};
