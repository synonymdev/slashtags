import { truncateMid } from '../utils';

export const Card = ({ metadata, publicKey, onClick = () => {} }) => (
  <div className="card login" onClick={onClick}>
    <img className="pp" src={metadata?.image}></img>
    <div className="right">
      <h2>{metadata?.name}</h2>
      <pre>{publicKey && truncateMid(publicKey)}</pre>
    </div>
  </div>
);
