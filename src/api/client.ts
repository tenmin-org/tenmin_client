import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://fb6c-95-141-143-19.ngrok-free.app';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  }
  return config;
});

export default apiClient;
