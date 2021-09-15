// @ts-nocheck
import { Client } from './Client';
import { Wallet } from './Wallet';
import { useState } from 'react';
import { secp256k1 as curve } from 'noise-curve-tiny-secp';

export const App = () => {
  const [userKeyPair, setKeyPair] = useState(
    curve.generateSeedKeyPair('Rip Hal!'),
  );

  const [stAction, setStAction] = useState();

  const setWallet = (seed) => {
    setKeyPair(curve.generateSeedKeyPair(seed));
  };

  return (
    <>
      <Wallet userKeyPair={userKeyPair} stAction={stAction} />
      <Client setWallet={setWallet} sendAction={setStAction} />
    </>
  );
};
