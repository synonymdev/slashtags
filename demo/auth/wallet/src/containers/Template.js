import { useContext } from 'react';
import { StoreContext, types } from '../strore';

const ScanQR = () => {
  const { store, dispatch } = useContext(StoreContext);

  const scanQR = () => {
    dispatch({ type: types.SET_VIEW, view: 'scanQR' });
  };

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={scanQR}
      style={{ cursor: 'pointer' }}
    >
      <path
        d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z"
        fill="#25272B"
      />
      <path
        d="M29.0952 16.4795C29.854 16.4795 30.2642 16.0591 30.2642 15.29V12.8188C30.2642 10.5527 29.0542 9.34277 26.7676 9.34277H24.2964C23.5273 9.34277 23.1069 9.76318 23.1069 10.522C23.1069 11.2705 23.5273 11.6909 24.2964 11.6909H26.5522C27.4341 11.6909 27.9263 12.1421 27.9263 13.0649V15.29C27.9263 16.0591 28.3364 16.4795 29.0952 16.4795ZM10.9048 16.4795C11.6738 16.4795 12.084 16.0591 12.084 15.29V13.0649C12.084 12.1421 12.5557 11.6909 13.4478 11.6909H15.7139C16.4829 11.6909 16.8931 11.2705 16.8931 10.522C16.8931 9.76318 16.4829 9.34277 15.7139 9.34277H13.2324C10.9561 9.34277 9.73584 10.5527 9.73584 12.8188V15.29C9.73584 16.0591 10.1562 16.4795 10.9048 16.4795ZM13.2324 29.8813H15.7139C16.4829 29.8813 16.8931 29.4609 16.8931 28.7021C16.8931 27.9434 16.4727 27.5332 15.7139 27.5332H13.4478C12.5557 27.5332 12.084 27.082 12.084 26.1489V23.9341C12.084 23.165 11.6636 22.7446 10.9048 22.7446C10.146 22.7446 9.73584 23.165 9.73584 23.9341V26.4053C9.73584 28.6714 10.9561 29.8813 13.2324 29.8813ZM24.2964 29.8813H26.7676C29.0542 29.8813 30.2642 28.6611 30.2642 26.4053V23.9341C30.2642 23.165 29.854 22.7446 29.0952 22.7446C28.3364 22.7446 27.9263 23.165 27.9263 23.9341V26.1489C27.9263 27.082 27.4341 27.5332 26.5522 27.5332H24.2964C23.5273 27.5332 23.1069 27.9434 23.1069 28.7021C23.1069 29.4609 23.5273 29.8813 24.2964 29.8813Z"
        fill="#636366"
      />
    </svg>
  );
};

const BackButton = () => {
  const { store, dispatch } = useContext(StoreContext);

  return (
    <div
      className="back-button"
      onClick={() => dispatch({ type: types.SET_VIEW, view: 'home' })}
    >
      <svg
        width="16"
        height="14"
        viewBox="0 0 16 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 7.98592H3.8L8.5 12.6197L7.1 14L0 7L7.1 0L8.5 1.38028L3.8 6.01408H16V7.98592Z"
          fill="#636366"
        />
      </svg>
    </div>
  );
};

const ProfileButton = () => {
  const { store, dispatch } = useContext(StoreContext);
  return (
    <div
      className="profile-button"
      onClick={() => dispatch({ type: types.SET_VIEW, view: 'profiles' })}
    >
      <svg
        width="24"
        height="24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          clipRule="evenodd"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11.845 21.662C8.152 21.662 5 21.087 5 18.787c0-2.301 3.133-4.425 6.845-4.425 3.691 0 6.844 2.103 6.844 4.404 0 2.3-3.133 2.896-6.845 2.896ZM11.837 11.174a4.386 4.386 0 1 0 0-8.774A4.388 4.388 0 0 0 7.45 6.787a4.37 4.37 0 0 0 4.356 4.387h.031Z" />
        </g>
      </svg>
    </div>
  );
};

export const Template = ({
  title,
  back = false,
  children = null,
  scan = true,
}) => {
  const { store, dispatch } = useContext(StoreContext);

  return (
    <>
      <header className="header">
        <div className="left">
          {back ? <BackButton /> : <ProfileButton />}
          <h1 className="title">{title}</h1>
        </div>
        <nav className="nav">
          {store.user && (
            <button className="profile">
              <img src={store.user?.image}></img>
            </button>
          )}
          {scan && <ScanQR />}
        </nav>
      </header>
      <main className="main">{children}</main>
    </>
  );
};
