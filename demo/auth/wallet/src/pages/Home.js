import { Template } from '../containers/Template';
import { Card } from '../components/Card';
import { ArrowSVG } from '../components/ArrowSVG';
import { useContext } from 'react';
import { StoreContext, types } from '../strore';
import { Article } from '../components/Article';

export const Home = () => {
  const { store, dispatch } = useContext(StoreContext);

  const isNew = store.accounts?.length === 0 || store.contacts?.length === 0;

  return (
    <Template title={'Wallet'}>
      <div className="home">
        {isNew ? (
          <>
            <ArrowSVG />
            <p className="get-started">
              Click the scan button to add new <span> account </span>
              or <span>contact</span>
            </p>
          </>
        ) : (
          <>
            {store.accounts.length > 0 && (
              <Article
                title="Accounts"
                onClick={() =>
                  dispatch({ type: types.SET_VIEW, view: 'scanQR' })
                }
              >
                {store.accounts.map((account) => (
                  <Card
                    key={account.publicKey}
                    publicKey={account.publicKey}
                    metadata={account.metadata}
                  />
                ))}
              </Article>
            )}
            {store.contacts?.length > 0 && <Article title="Contacts"></Article>}
          </>
        )}
      </div>
    </Template>
  );
};
