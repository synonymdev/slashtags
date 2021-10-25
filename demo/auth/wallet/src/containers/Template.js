import { useContext } from 'react';
import { StoreContext } from '../strore';

export const Template = ({ title, children = null }) => {
  const { store, dispatch } = useContext(StoreContext);
  return (
    <>
      <header className="header">
        <h1 className="title">{title}</h1>
        <nav className="nav">
          {store.user && (
            <button className="profile">
              <img src={store.user?.image}></img>
            </button>
          )}
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
};
