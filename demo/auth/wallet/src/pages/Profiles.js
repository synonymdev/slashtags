import { Template } from '../containers/Template';
import { useContext, useState } from 'react';
import { StoreContext, types } from '../strore';
import { Card } from '../components/Card';

export const ProfilesPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const profiles = store.profiles;

  return (
    <Template title="Profiles" back={true}>
      {profiles.map(({ metadata, keyPair }) => (
        <Card
          key={keyPair.publicKey.toString('hex')}
          metadata={metadata}
          publicKey={keyPair.publicKey.toString('hex')}
        ></Card>
      ))}
    </Template>
  );
};
