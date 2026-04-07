import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../services/api';

// ─── localStorage helpers (for theme/UI prefs only) ───
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(`mm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(`mm_${key}`, JSON.stringify(value)); } catch {}
}

export function usePersistedState(key, fallback) {
  const [state, setState] = useState(() => load(key, fallback));
  useEffect(() => { save(key, state); }, [key, state]);
  return [state, setState];
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

// ═══════════════════════════════════════
//  RBAC Matrix
// ═══════════════════════════════════════
const ROLE_PERMISSIONS = {
  admin: {
    pages: ['/', '/powder-stock', '/tasks', '/quality', '/metrics', '/stickers', '/settings'],
    canCreate: true, canEdit: true, canDelete: true, canExport: true, canManageTeam: true,
  },
  operator: {
    pages: ['/', '/powder-stock', '/tasks', '/quality', '/metrics'],
    canCreate: true, canEdit: false, canDelete: false, canExport: false, canManageTeam: false,
  },
};

// ═══════════════════════════════════════
//  Auth Context (Hits Django + JWT)
// ═══════════════════════════════════════
export const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  isAdmin: false,
  permissions: ROLE_PERMISSIONS.operator,
  canAccess: () => false,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('mm_access_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Token expired or invalid", err);
          api.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      await api.login(username, password);
      const userData = await api.getMe();
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const permissions = ROLE_PERMISSIONS[user?.role || 'operator'];

  const canAccess = useCallback((path) => {
    if (!user) return false;
    return permissions.pages.includes(path);
  }, [user, permissions]);

  const value = { user, login, logout, isAdmin, permissions, canAccess, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// UI notifications hook (local only)
export function useActivityFeed() {
  const [feed, setFeed] = usePersistedState('activityFeed', []);
  const logActivity = useCallback((user, action, target, type = 'info') => {
    const entry = {
      id: Date.now(), user, action, target, type,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setFeed((prev) => [entry, ...prev].slice(0, 50));
  }, [setFeed]);
  return { feed, logActivity };
}

// UI preferences
export function useCompanyInfo() { return usePersistedState('companyInfo', { name: 'Metamorph Metal Protect LLP' }); }
export function useNotifications() { return usePersistedState('notifications', { lowStock: true, weeklyReport: true }); }

// Export helper
export function exportCSV(filename, headers, rows) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `${filename}.csv`;
  link.click(); URL.revokeObjectURL(url);
}
