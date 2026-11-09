import React from 'react';
import { createRoot } from 'react-dom/client';
import { DirectoryPage } from '@/pages/DirectoryPage';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DirectoryPage />
  </React.StrictMode>,
);
