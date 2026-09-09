import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Page from './pages/Mcp';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
