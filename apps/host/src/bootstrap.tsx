import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadAppConfig } from './appConfig';
import { setAppConfig } from './config';
import './styles.css';

(window.__reactCopies ||= []).push(React);
// Nạp /config.json TRƯỚC khi dựng giao diện (URL Remote và Facade phụ thuộc môi trường).
loadAppConfig().then(({ config, errors }) => {
  if (errors.length) console.error('[host] cấu hình không hợp lệ, dùng giá trị mặc định cho:', errors);
  setAppConfig(config, errors);
  createRoot(document.getElementById('root')!).render(<App />);
});
