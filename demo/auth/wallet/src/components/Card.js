import { truncateMid } from '../utils';
import { anonImage } from '../constants';
import React, { useRef, useEffect } from 'react';
import * as jdenticon from 'jdenticon';

const Jdenticon = ({ value = 'test', size = '100%' }) => {
  const icon = useRef(null);

  useEffect(() => {
    jdenticon.update(icon.current, value);
  }, [value]);

  return (
    <div>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  );
};

export const Card = ({ profile, onClick = () => {}, className = '' }) => (
  <div className={'card login ' + className} onClick={onClick}>
    {profile.image ? (
      <img alt="" className="pp" src={profile?.image || anonImage}></img>
    ) : (
      <Jdenticon size="48" value={profile['@id']} />
    )}
    <div className="right">
      <h2>{profile?.name || 'Anon...'}</h2>
      <pre>{profile?.['@id'] && truncateMid(profile['@id'], 15)}</pre>
    </div>
  </div>
);
