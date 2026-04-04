import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCompanyInfo, useTheme, useAuth } from '../store/useStore';

export default function Header({ onToggleSidebar, onToggleMobileMenu }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [companyInfo] = useCompanyInfo();

  // Close dropdowns when clicking outside
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0 relative"
      style={{
        background: 'var(--header-bg)',
        borderColor: 'var(--divider)',
        backdropFilter: 'blur(12px)',
        zIndex: 40,
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onToggleMobileMenu}
          className="lg:hidden"
          style={{ color: 'var(--text-muted)' }}
          whileTap={{ scale: 0.9 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
        <h1 className="font-heading font-bold text-lg hidden md:block" style={{ color: 'var(--text-primary)' }}>
          Metamorph <span style={{ color: '#E8771A' }}>Metal Protect</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search bar */}
        <motion.div
          className="relative hidden sm:flex items-center"
          animate={{ width: searchOpen ? 280 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
            width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search... ⌘K"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2 text-sm"
            style={{ height: 38 }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
        </motion.div>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl"
          style={{
            background: 'var(--btn-bg)',
            color: theme === 'dark' ? '#FACC15' : '#1E3A5F',
            border: '1px solid var(--btn-border)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </motion.button>

        {/* Notification bell — now with dropdown */}
        <div className="relative" ref={notifRef}>
          <motion.button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2.5 rounded-xl cursor-pointer"
            style={{
              background: 'var(--btn-bg)',
              color: 'var(--text-muted)',
              border: '1px solid var(--btn-border)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Notification dot */}
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ background: '#E8771A', boxShadow: '0 0 6px rgba(232, 119, 26, 0.6)' }}
            />
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--modal-bg)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  zIndex: 60,
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--divider)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                </div>
                <div className="p-4 flex flex-col items-center justify-center" style={{ minHeight: 120 }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 8 }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No new notifications</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar & profile dropdown */}
        <div className="relative" ref={profileRef}>
          <motion.button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl cursor-pointer"
            style={{ background: 'var(--btn-bg)', border: '1px solid var(--glass-border)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #E8771A, #C96410)', color: '#FFFFFF' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Guest'}</span>
            <svg style={{ color: 'var(--text-muted)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden"
                style={{
                  background: 'var(--modal-bg)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  zIndex: 60,
                }}
              >
                <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--divider)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md overflow-hidden" 
                       style={{ background: 'linear-gradient(135deg, #E8771A, #C96410)' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold truncate w-[140px]" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{user?.role} Portal</p>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile Settings
                  </button>
                </div>
                
                <div className="p-2 border-t" style={{ borderColor: 'var(--divider)' }}>
                  <button 
                    onClick={() => { setProfileOpen(false); logout(); }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 text-red-500 hover:bg-red-500/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
