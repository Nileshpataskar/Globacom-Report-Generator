import { useState } from 'react';
import { login, saveTokens } from './services/authService';

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  card: {
    background: '#fff',
    border: '1px solid #dde1e7',
    borderRadius: '6px',
    padding: '40px 36px',
    width: '360px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e2a38',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
  field: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#444',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '9px 11px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '10px',
    background: '#1e2a38',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    marginTop: '12px',
    padding: '8px 12px',
    background: '#fff5f5',
    border: '1px solid #feb2b2',
    borderRadius: '4px',
    color: '#c53030',
    fontSize: '12px',
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(username.trim(), password);
      saveTokens(data.accessToken, data.refreshToken);
      onLoginSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.errorMessage ||
        err?.response?.data?.title ||
        err?.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <p style={S.title}>RelayCSP PreProd Report Generator</p>
          <p style={S.subtitle}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Username</label>
            <input
              style={S.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <input
              style={S.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {error && <div style={S.error}>{error}</div>}
      </div>
    </div>
  );
}
