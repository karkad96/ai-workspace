import { useEffect, useState } from 'react';

function loadStored() {
  try {
    const s = localStorage.getItem('auth');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = loadStored();
    if (!stored) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${stored.token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => setUser(stored))
      .catch(() => localStorage.removeItem('auth'));
  }, []);

  const login = (data) => {
    const userData = { email: data.email, token: data.token };
    localStorage.setItem('auth', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setUser(null);
  };

  return { user, login, logout };
}
