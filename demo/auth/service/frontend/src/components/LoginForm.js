import { useState, useRef, useEffect, useContext } from 'react';
import QRCode from 'qrcode';
import { StoreContext } from '../store';
import { truncateMid } from '../utils';

export const LoginForm = ({ qrURL }) => {
  const canvasRef = useRef();
  qrURL = qrURL || '';
  const [copied, setCopied] = useState(false);

  const { store, dispatch } = useContext(StoreContext);

  useEffect(() => {
    if (store.loginURL !== qrURL) qrURL = store.loginURL;

    if (qrURL && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrURL, {
        margin: 6,
        scale: 8,

        color: {
          light: '#f7931a',
          dark: '#fff',
        },
      });
    }
  }, [qrURL, store.loginURL]);

  return (
    <div className="options">
      <p>Don't have a Slashtags compatible wallet?</p>
      <a
        className="get-it"
        href="https://slashtags-wallet.netlify.app/"
        target="_blank"
        rel="noreferrer"
      >
        Get Demo wallet
      </a>
      <div className="or">
        <div className="line" />
        <p>OR</p>
        <div className="line" />
      </div>
      <p>Scan or copy SlashtagsURL</p>
      <div className="card">
        <canvas
          className="qr"
          ref={canvasRef}
          onClick={() => {
            navigator.clipboard.writeText(qrURL);
            console.log('copied QR: ', qrURL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
          }}
        />

        <div className="qrcopy">
          {copied ? <span>Action url copied</span> : <span>Click to copy</span>}

          <svg
            width="14"
            height="16"
            viewBox="0 0 14 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="10" height="12" rx="2" fill="white" />
            <rect
              x="3"
              y="3"
              width="10"
              height="12"
              rx="2"
              fill="white"
              stroke="#f7931a"
            />
          </svg>
        </div>
      </div>

      <a className="card url" href={qrURL}>
        {truncateMid(qrURL, 19)}
      </a>
    </div>
  );
};
