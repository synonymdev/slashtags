import { Template } from '../containers/Template';
import { useContext, useState, useEffect, useRef } from 'react';
import { StoreContext, types } from '../store';
import { Card } from '../components/Card';
import QRCode from 'qrcode';

export const QRPage = () => {
  const { store, dispatch } = useContext(StoreContext);
  const [copied, setCopied] = useState(false);
  const [qrURL, setQrURL] = useState('');
  const [timedOut, setTimedOut] = useState(0);
  const canvasRef = useRef();

  useEffect(() => {
    (async () => {
      const auth = await store.dependencies.auth;

      const issueUrl = () =>
        auth.issueURL({
          onTimeout: () => setTimedOut(timedOut + 1),
          /** @type {import ('@synonymdev/slashtags-auth').OnRequest} */
          onRequest: () => ({ responder: store.responder }),
          /** @type {import ('@synonymdev/slashtags-auth').OnSuccsess} */
          onSuccess: (connection) => {
            console.log('got connection', connection);
            dispatch({
              type: types.ADD_CONNECTION,
              connection,
            });
          },
        });

      const updateQR = (url) => {
        setQrURL(url);

        QRCode.toCanvas(canvasRef.current, url, {
          margin: 4,
          scale: 6.1,

          color: {
            light: '#f7931a',
            dark: '#fff',
          },
        });
      };

      const url = issueUrl();
      updateQR(url);
    })();
  }, [timedOut, dispatch, store.dependencies.auth, store.responder]);

  return (
    <Template title={`Connect to`} back={true}>
      <Card profile={store.responder.profile}></Card>
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
    </Template>
  );
};
