import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ─── localStorage helpers ───
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(`mm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(`mm_${key}`, JSON.stringify(value)); } catch {}
}

// ─── Generic hook for a persisted array ───
export function usePersistedState(key, fallback) {
  const [state, setState] = useState(() => load(key, fallback));

  useEffect(() => { save(key, state); }, [key, state]);

  return [state, setState];
}

// ─── Activity feed: auto-generated from actions ───
export function useActivityFeed() {
  const [feed, setFeed] = usePersistedState('activityFeed', []);

  const logActivity = useCallback((user, action, target, type = 'info') => {
    const entry = {
      id: Date.now(),
      user,
      action,
      target,
      type,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    setFeed((prev) => [entry, ...prev].slice(0, 50)); // keep last 50
  }, [setFeed]);

  return { feed, logActivity };
}

// ─── Theme context ───
export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeState() {
  const [theme, setTheme] = usePersistedState('theme', 'dark');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return { theme, toggleTheme };
}

// ─── Auth state ───
export function useAuth() {
  const [user, setUser] = usePersistedState('user', null);

  const login = useCallback((role) => {
    setUser({ role, name: role === 'admin' ? 'Admin / Supervisor' : 'Operator' });
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  return { user, login, logout, isAdmin: user?.role === 'admin' };
}

// ─── Company info ───
const defaultCompany = {
  name: 'Metamorph Metal Protect LLP',
  email: '',
  phone: '',
  location: '',
};

export function useCompanyInfo() {
  return usePersistedState('companyInfo', defaultCompany);
}

// ─── Notification preferences ───
const defaultNotifications = {
  lowStock: true,
  qualityFailures: true,
  taskAssignments: true,
  gasRefill: true,
  dailySummary: false,
  weeklyReport: true,
};

export function useNotifications() {
  return usePersistedState('notifications', defaultNotifications);
}

// ─── CSV export helper ───
export function exportCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
