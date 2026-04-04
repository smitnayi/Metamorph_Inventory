import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import PowderStock from './pages/PowderStock';
import TaskManager from './pages/TaskManager';
import QualityManagement from './pages/QualityManagement';
import UsageMetrics from './pages/UsageMetrics';
import Settings from './pages/Settings';
import StickerGenerator from './pages/StickerGenerator';
import Login from './pages/Login';
import { ThemeContext, useThemeState, AuthProvider, useAuth } from './store/useStore';

// ── Toast context ──
export const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

// ── Protected Route — redirects if user role can't access ──
function ProtectedRoute({ path, children }) {
  const { canAccess } = useAuth();

  if (!canAccess(path)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── Animated page transitions ──
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 overflow-y-auto p-6"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/powder-stock" element={<PowderStock />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/quality" element={<QualityManagement />} />
          <Route path="/metrics" element={<UsageMetrics />} />
          <Route path="/stickers" element={
            <ProtectedRoute path="/stickers"><StickerGenerator /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute path="/settings"><Settings /></ProtectedRoute>
          } />
          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main layout ──
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={addToast}>
      <div className="flex h-screen overflow-hidden relative">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileMenuOpen} closeMobile={() => setMobileMenuOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden w-full">
          <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} onToggleMobileMenu={() => setMobileMenuOpen(true)} />
          <AnimatedRoutes />
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[50] lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── App content — decides login vs layout ──
function AppContent() {
  const { user } = useAuth();
  return user ? <AppLayout /> : <Login />;
}

// ── App root with providers ──
function App() {
  const { theme, toggleTheme } = useThemeState();

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className={theme}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </div>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
