import { Template } from '../containers/Template';
import { useContext, useState } from 'react';
import { StoreContext, types } from '../store';
import { Card } from '../components/Card';

export const PersonasPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const { personas } = store;

  return (
    <Template title="Personas" back={true}>
      {personas.map((persona) => (
        <Card profile={persona.profile}></Card>
      ))}
    </Template>
  );
};
