import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import { ThemeContext, useThemeState, useAuth } from './store/useStore';

// ── Toast context ──
export const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
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
          <Route path="/stickers" element={<StickerGenerator />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main layout ──
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <AnimatedRoutes />
        </div>
      </div>
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── App root with theme provider ──
function App() {
  const { theme, toggleTheme } = useThemeState();
  const { user } = useAuth();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        <BrowserRouter>
          {user ? <AppLayout /> : <Login />}
        </BrowserRouter>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
