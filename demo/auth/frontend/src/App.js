// @ts-nocheck
import { Client } from './Client';
import { Wallet } from './Wallet';
import { useState } from 'react';

export const App = () => {
  const [actionURL, setActionURL] = useState();
  const [username, setUsername] = useState('Hal Finney');

  return (
    <>
      <Wallet actionURL={actionURL} username={username} />
      <Client setWallet={setUsername} sendAction={setActionURL} />
    </>
  );
};
