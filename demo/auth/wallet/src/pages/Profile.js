import { Template } from '../containers/Template';
import { useContext, useState, useEffect, useRef } from 'react';
import { StoreContext, types } from '../store';
import { Card } from '../components/Card.js';
import QRCode from 'qrcode';

export const ProfilePage = () => {
  const { state, dispatch } = useContext(StoreContext);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState();
  const canvasRef = useRef();

  useEffect(() => {
    (async () => {
      const slashtag = await state.currentUser;

      const profile = await slashtag.getProfile();
      setProfile(profile);

      const updateQR = (url) => {
        QRCode.toCanvas(canvasRef.current, url, {
          margin: 4,
          scale: 6.1,

          color: {
            light: '#f7931a',
            dark: '#fff',
          },
        });
      };

      updateQR(profile.id);
    })();
  }, [dispatch, state.auth]);

  return (
    <Template title={`Connect to`} back={true}>
      <Card profile={profile || {}}></Card>
      <div className="card card-qr">
        <canvas
          className="qr"
          ref={canvasRef}
          onClick={() => {
            navigator.clipboard.writeText(profile.id);
            console.log('copied QR: ', profile.id);
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
