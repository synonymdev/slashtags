import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import { App } from './containers/App';

localStorage.debug = '*';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
