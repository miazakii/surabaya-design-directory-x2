import React from 'react';
import { createRoot } from 'react-dom/client';
import { AboutPage } from '@/pages/AboutPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AboutPage />
  </React.StrictMode>,
);
