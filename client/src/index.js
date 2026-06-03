import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Ant Design
import { ConfigProvider } from 'antd';
import { SocketProvider } from './context/SocketContext';
import 'antd/dist/reset.css';
import './styles/accessibility.css';

// Redux
import { Provider } from 'react-redux';
import { store } from './app/store';

// --- THIS IS THE FINAL, CRITICAL SETUP ---
// 1. Import the main axios instance.
import api from './services/api';

// 2. Import the setup function.
import setupInterceptors from './services/apiInterceptors';
import { startTokenManager } from './services/tokenManager';

// 3. Guard against multiple initializations
if (!window.__interceptorsInitialized) {
  setupInterceptors(api, store);
  window.__interceptorsInitialized = true;
  startTokenManager(store);
}
// --- END OF CRITICAL SETUP ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider>
           <SocketProvider>
            <App />
           </SocketProvider>
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);