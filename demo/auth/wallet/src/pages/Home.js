// @ts-nocheck
import { Template } from '../containers/Template';
import { Card } from '../components/Card';
import { ArrowSVG } from '../components/ArrowSVG';
import { useContext } from 'react';
import { StoreContext, types } from '../store';
import { Article } from '../components/Article';

export const Home = () => {
  const { store, dispatch } = useContext(StoreContext);

  const isNew = Object.values(store.connections)?.length === 0;

  return (
    <Template title={'Wallet'}>
      <div className="home">
        {isNew ? (
          <>
            <ArrowSVG />
            <div className="get-started">
              <p>
                Add your first
                <br />
                <span>Connection</span>
                <br />
                by scanning a
                <br />
                <span>Slashtags Auth</span>
                <br />
                QR code
              </p>
              <br />
              <p style={{ fontSize: '2rem' }}>
                Or Generate a QR for one of your
                <br />
                <button
                  className="btn-transparent"
                  onClick={() =>
                    dispatch({ type: types.SET_VIEW, view: 'personas' })
                  }
                >
                  <span>Personas</span>
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
            {Object.values(store.connections)?.length > 0 && (
              <Article
                title="Connections"
                onClick={() =>
                  dispatch({ type: types.SET_VIEW, view: 'scanQR' })
                }
              >
                {Object.values(store.connections).map(
                  ({ persona, remotes }) => (
                    <>
                      <Card
                        key={persona['@id']}
                        profile={persona}
                        className="connection-local"
                      />
                      {console.log(persona, Object.values(remotes))}
                      {Object.values(remotes).map((remote) => (
                        <Card
                          key={remote['@id']}
                          profile={remote}
                          className="connection-remote"
                          onClick={() =>
                            dispatch({
                              type: types.SET_PROFILE,
                              profile: remote,
                            })
                          }
                        />
                      ))}
                    </>
                  ),
                )}
              </Article>
            )}
            {store.contacts?.length > 0 && <Article title="Contacts"></Article>}
          </>
        )}
      </div>
    </Template>
  );
};
