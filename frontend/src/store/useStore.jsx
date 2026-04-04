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

// ═══════════════════════════════════════
//  RBAC: Role-Based Access Control
// ═══════════════════════════════════════

// Permission matrix per role
const ROLE_PERMISSIONS = {
  admin: {
    pages: ['/', '/powder-stock', '/tasks', '/quality', '/metrics', '/stickers', '/settings'],
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageTeam: true,
  },
  operator: {
    pages: ['/', '/powder-stock', '/tasks', '/quality', '/metrics'],
    canCreate: true,   // operators do data entry
    canEdit: false,
    canDelete: false,
    canExport: false,
    canManageTeam: false,
  },
};

// Auth context — single source of truth for auth state
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  permissions: ROLE_PERMISSIONS.operator,
  canAccess: () => false,
});

// Auth provider — wraps the entire app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => load('user', null));

  // Persist user to localStorage on change
  useEffect(() => { save('user', user); }, [user]);

  const login = useCallback((role) => {
    const newUser = {
      role,
      name: role === 'admin' ? 'Admin / Supervisor' : 'Operator',
    };
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const permissions = ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.operator;

  // Check if current role can access a specific page path
  const canAccess = useCallback((path) => {
    if (!user) return false;
    return permissions.pages.includes(path);
  }, [user, permissions]);

  const value = {
    user,
    login,
    logout,
    isAdmin,
    permissions,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to consume auth context
export function useAuth() {
  return useContext(AuthContext);
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
