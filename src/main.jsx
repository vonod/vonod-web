import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import LandingPage from './LandingPage';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>,
);
