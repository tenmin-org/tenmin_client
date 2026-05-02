import axios from 'axios';

/** Задаётся при сборке: VITE_API_URL (см. Dockerfile + docker-compose build.args). */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)
  ?.replace(/\/$/, '');

if (!API_URL) {
  console.error(
    'VITE_API_URL is empty: rebuild the client image with build arg VITE_API_URL (e.g. API_URL in .env).'
  );
}

const apiClient = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
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
