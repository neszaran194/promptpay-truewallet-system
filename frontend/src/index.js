import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set up environment variables for React
if (!process.env.REACT_APP_API_URL) {
  console.warn('REACT_APP_API_URL not set, using default: http://localhost:3001/api');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);