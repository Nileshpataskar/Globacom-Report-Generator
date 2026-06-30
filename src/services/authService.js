import axios from 'axios';

const BASE_URL = window.baseUrl || process.env.REACT_APP_BASE_URL || '';

export async function login(username, password) {
  const { data } = await axios.post(`${BASE_URL}/Account/Authenticate`, { username, password });
  return data; // expects { accessToken, refreshToken, ... }
}

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isAuthenticated() {
  return !!localStorage.getItem('accessToken');
}
