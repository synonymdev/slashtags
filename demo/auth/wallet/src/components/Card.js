import { truncateMid } from '../utils';
import { anonImage } from '../constants';

export const Card = ({
  metadata,
  publicKey,
  onClick = () => {},
  className,
}) => (
  <div className={'card login ' + className} onClick={onClick}>
    <img className="pp" src={metadata?.image || anonImage}></img>
    <div className="right">
      <h2>{metadata?.name || 'Anon...'}</h2>
      <pre>{publicKey && truncateMid(publicKey)}</pre>
    </div>
  </div>
);
