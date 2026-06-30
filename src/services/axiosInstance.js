import axios from 'axios';

const BASE_URL = window.baseUrl || process.env.REACT_APP_BASE_URL || '';

let isRefreshing = false;
const pendingQueue = [];

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — refresh token, replay queue
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const status = err?.response?.status;
    const errTitle = err?.response?.data?.title;

    // Session closed / idle expired — force logout
    if (errTitle === 'SessionClosed' || errTitle === 'IdleSessionExpired') {
      localStorage.clear();
      window.location.href = '/';
      return Promise.reject(err);
    }

    // 401 and not already retried
    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/Account/RefreshToken`, { refreshToken: rt });
        const { accessToken, refreshToken } = data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        pendingQueue.forEach(({ resolve }) => resolve(accessToken));
        pendingQueue.length = 0;

        original.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(original);
      } catch (refreshErr) {
        pendingQueue.forEach(({ reject }) => reject(refreshErr));
        pendingQueue.length = 0;
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
