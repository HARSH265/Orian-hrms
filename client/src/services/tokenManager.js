// In: client/src/services/tokenManager.js

import api from './api';
import logger from '../utils/logger';

let refreshTimer = null;
let warningTimer = null;
let focusHandler = null;
let _store = null;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const REFRESH_MARGIN_PCT = 0.8; // Refresh at 80% of expiry

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

function getTokenExpiry(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return decoded.exp * 1000; // convert to ms
}

export function getRemainingTime() {
  const token = getCookie('accessToken');
  if (!token) return 0;
  const expiry = getTokenExpiry(token);
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
}

export function clearTokenTimers() {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  if (warningTimer) { clearTimeout(warningTimer); warningTimer = null; }
}

export function stopTokenManager() {
  clearTokenTimers();
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler);
    focusHandler = null;
  }
}

export function startTokenManager(store) {
  if (store) _store = store;
  if (!_store) return;
  clearTokenTimers();
  stopTokenManager();

  const token = getCookie('accessToken');
  if (!token) return;

  const expiry = getTokenExpiry(token);
  if (!expiry) return;

  const remaining = expiry - Date.now();
  const warningAt = remaining - WARNING_BEFORE_EXPIRY_MS;
  const refreshAt = remaining * REFRESH_MARGIN_PCT;

  // Schedule expiry warning
  if (warningAt > 0) {
    warningTimer = setTimeout(() => {
      logger.warn('[TokenManager] Token expiring soon');
      _store.dispatch({ type: 'auth/tokenExpiryWarning' });
    }, remaining - WARNING_BEFORE_EXPIRY_MS);
  }

  // Schedule proactive refresh
  if (refreshAt > 0) {
    refreshTimer = setTimeout(async () => {
      try {
        logger.info('[TokenManager] Proactive token refresh');
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        if (data.accessToken) {
          _store.dispatch({ type: 'auth/tokenRefreshed', payload: data.accessToken });
          document.cookie = `accessToken=${data.accessToken}; path=/; Secure; SameSite=Strict`;
        }
      } catch (err) {
        logger.error('[TokenManager] Proactive refresh failed:', err);
      }
    }, refreshAt);
  }

  // Refresh on window focus if less than 2 minutes remain
  focusHandler = () => {
    const remainingNow = getRemainingTime();
    if (remainingNow > 0 && remainingNow < 2 * 60 * 1000) {
      logger.info('[TokenManager] Window focus refresh');
      api.post('/auth/refresh', {}, { withCredentials: true })
        .then(({ data }) => {
          if (data.accessToken) {
            _store.dispatch({ type: 'auth/tokenRefreshed', payload: data.accessToken });
            document.cookie = `accessToken=${data.accessToken}; path=/; Secure; SameSite=Strict`;
          }
        })
        .catch((err) => logger.error('[TokenManager] Focus refresh failed:', err));
    }
  };
  window.addEventListener('focus', focusHandler);

  // Update Redux with token expiry info
  _store.dispatch({ type: 'auth/setTokenExpiry', payload: expiry });
}
