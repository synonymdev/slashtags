import { Template } from '../containers/Template';
import { useContext } from 'react';
import { StoreContext, types } from '../store';
import { Card } from '../components/Card';

export const PersonasPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const { personas } = store;

  return (
    <Template title="Personas" back={true}>
      {personas.map((persona) => (
        <button
          key={persona.profile['@id']}
          className="btn-transparent"
          onClick={() => {
            dispatch({
              type: types.AUTH_QR,
              persona,
            });
          }}
        >
          <Card profile={persona.profile}></Card>
        </button>
      ))}
    </Template>
  );
};
