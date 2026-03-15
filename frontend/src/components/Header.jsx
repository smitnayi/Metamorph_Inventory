import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../store/useStore';

export default function Header({ onToggleSidebar }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--divider)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onToggleSidebar}
          className="lg:hidden"
          style={{ color: 'var(--text-muted)' }}
          whileTap={{ scale: 0.9 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
        <h1 className="font-heading font-bold text-lg hidden md:block" style={{ color: 'var(--text-primary)' }}>
          Metamorph <span className="text-amber font-normal">Metal Protect</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <motion.div className="relative" animate={{ width: searchOpen ? 280 : 180 }} transition={{ duration: 0.3 }}>
          <input
            type="text"
            placeholder="Search... ⌘K"
            className="glass-input w-full pl-9 pr-4 py-2 text-sm"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </motion.div>

        {/* Theme toggle */}
        <motion.button
          onClick={toggleTheme}
          className="p-2 rounded-lg"
          style={{ background: 'var(--btn-bg)', color: 'var(--text-muted)' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
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

        {/* Notification bell */}
        <motion.button
          className="relative p-2 rounded-lg"
          style={{ background: 'var(--btn-bg)', color: 'var(--text-muted)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </motion.button>

        {/* User avatar */}
        <div className="relative">
          <motion.button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl"
            style={{ background: 'var(--btn-bg)', border: '1px solid var(--glass-border)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #F5A623, #D48B0F)', color: '#0D0F14' }}>
              SM
            </div>
            <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>Smit N.</span>
            <svg style={{ color: 'var(--text-muted)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.button>

          {/* Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'var(--modal-bg)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <div className="p-3 border-b" style={{ borderColor: 'var(--divider)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Smit Nayi</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>admin@metamorph.in</p>
                </div>
                <div className="py-1">
                  {['Profile', 'Settings', 'Sign out'].map((item) => (
                    <button key={item}
                      className="w-full text-left px-3 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => setProfileOpen(false)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
