import { Template } from '../containers/Template';
import { useContext } from 'react';
import { StoreContext } from '../strore';
import { secp256k1 } from 'noise-curve-tiny-secp';
import bint from 'bint8array';
import { truncateMid } from '../utils';

export const SingAs = ({ user }) => {
  const { store, dispatch } = useContext(StoreContext);

  const keypair = secp256k1.generateSeedKeyPair(user.title);
  const pk = bint.toString(keypair.publicKey, 'hex');

  return (
    <button
      className="card login"
      onClick={() => {
        dispatch({ type: 'SET_USER', user: { ...user, pk }, keypair });
        dispatch({ type: 'SET_VIEW', view: 'contacts' });
      }}
    >
      <img className="pp" src={user.image}></img>
      <div className="right">
        <h2>{user.title}</h2>
        <pre>{truncateMid(pk)}</pre>
      </div>
    </button>
  );
};

export const Home = () => {
  return (
    <Template title={'Login'}>
      <div className="home">
        <SingAs
          user={{
            title: 'John Carvalho',
            image:
              'https://pbs.twimg.com/profile_images/1447755054719643649/SCJJteiL_400x400.jpg',
          }}
        />
        <SingAs
          user={{
            title: 'Paolo Ardoino',
            image:
              'https://pbs.twimg.com/profile_images/1366374272369913860/o9AuB1JF_400x400.jpg',
          }}
        />
      </div>
    </Template>
  );
};
