import React from 'react';
import { createRoot } from 'react-dom/client';
import { RegisterPage } from '@/pages/RegisterPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RegisterPage />
  </React.StrictMode>,
);
