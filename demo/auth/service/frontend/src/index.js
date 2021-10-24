import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import { App } from './containers/App';
import https from 'https';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
