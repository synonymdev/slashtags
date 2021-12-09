import { truncateMid } from '../utils';
import { anonImage } from '../constants';

export const Card = ({ profile, onClick = () => {}, className }) => (
  <div className={'card login ' + className} onClick={onClick}>
    <img className="pp" src={profile?.image || anonImage}></img>
    <div className="right">
      <h2>{profile?.name || 'Anon...'}</h2>
      <pre>{profile?.['@id'] && truncateMid(profile['@id'], 15)}</pre>
    </div>
  </div>
);
