// @ts-nocheck
import { Template } from '../containers/Template';
import { Card } from '../components/Card';
import { ArrowSVG } from '../components/ArrowSVG';
import { useContext } from 'react';
import { StoreContext } from '../store';
import { Footer } from '../components/Footer.js';

export const Home = () => {
  const { state, dispatch } = useContext(StoreContext);

  const isNew = state.contacts.length === 0 && state.accounts.length === 0;

  return (
    <Template title={'Wallet'}>
      <div className="home">
        {isNew ? (
          <>
            <ArrowSVG />
            <div className="get-started">
              <p>
                Scan a QR <br />
                to add your first
                <br />
                <span>Account</span>
                <br />
                Or
                <br />
                <span>Contact</span>
                <br />
                Or show your Slashtag QR
              </p>
            </div>
          </>
        ) : (
          <>
            {state.accounts.length > 0 && (
              <article>
                <header className="article-header">
                  <h2>Accounts</h2>
                </header>
                {state.accounts.map(({ profile }) => (
                  <Card key={profile.id} profile={profile} />
                ))}
              </article>
            )}
            {state?.contacts?.length > 0 && (
              <article>
                <header className="article-header">
                  <h2>Contacts</h2>
                </header>
                {state.contacts.map(({ profile }) => (
                  <Card key={profile.id} profile={profile} />
                ))}
              </article>
            )}
          </>
        )}
      </div>

      <Footer />
    </Template>
  );
};
