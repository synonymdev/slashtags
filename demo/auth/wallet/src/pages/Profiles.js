import { Template } from '../containers/Template';
import { useContext, useState } from 'react';
import { StoreContext, types } from '../store';
import { Card } from '../components/Card';

export const ProfilesPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const profiles = store.profiles;

  return (
    <Template title="Profiles" back={true}>
      {profiles.map((profile) => (
        <Card profile={profile.metadata}></Card>
      ))}
    </Template>
  );
};
