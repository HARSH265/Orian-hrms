import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Ant Design
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';

// Redux
import { Provider } from 'react-redux';
import { store } from './app/store';

// --- THIS IS THE FINAL, CRITICAL SETUP ---
// 1. Import the "dumb" api instance.
import api from './services/api';
// 2. Import the "dumb" setup function.
import setupInterceptors from './services/apiInterceptors';

// 3. Run the setup function here, ONLY ONCE, after all modules are loaded.
//    This wires up the interceptors to the single api instance.
setupInterceptors(api, store);
// --- END OF CRITICAL SETUP ---

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);