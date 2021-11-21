import { Template } from '../containers/Template';
import { useContext, useState, useEffect } from 'react';
import { StoreContext, types } from '../store';
import { truncateMid } from '../utils';
import faker from 'faker';

const Item = ({ label, value }) => {
  return (
    <div className="feed-item">
      <p className="feed-label">{label}</p>
      <p className="feed-value">{value}</p>
    </div>
  );
};

export const FeedsPage = () => {
  const { store, dispatch } = useContext(StoreContext);

  const account = store.account;

  // Mock feeds data
  const feeds = [
    {
      name: 'Profile',
      data: account.profile.metadata || { name: 'Anon...' },
    },
    {
      name: 'Balance',
      data: {
        Bitcoin: faker.finance.amount(0, 50, 2),
      },
    },
    {
      name: 'Music',
      data: {
        genre: faker.music.genre(),
      },
    },
  ];

  return (
    <Template title="" back={true}>
      <div className="feeds-header">
        <img className="feeds-image" src={account.service.metadata.image}></img>
        <p className="feeds-title">{account.service.metadata.name}</p>
        <p className="feeds-pk">{truncateMid(account.service.publicKey)}</p>
      </div>
      {feeds?.map((feed) => (
        <div>
          <p className="feed-name">{feed.name}</p>
          {Object.entries(feed.data).map(([key, value]) => (
            <Item label={key} value={value} />
          ))}
        </div>
      ))}
    </Template>
  );
};
