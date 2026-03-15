import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onToggleSidebar }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 border-b flex-shrink-0"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <motion.button
          onClick={onToggleSidebar}
          className="lg:hidden text-text-muted hover:text-text-primary"
          whileTap={{ scale: 0.9 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </motion.button>
        <h1 className="font-heading font-bold text-lg text-text-primary hidden md:block">
          Metamorph <span className="text-amber font-normal">Metal Protect</span>
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <motion.div
          className="relative"
          animate={{ width: searchOpen ? 280 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <input
            type="text"
            placeholder="Search... ⌘K"
            className="glass-input w-full pl-9 pr-4 py-2 text-sm"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </motion.div>

        {/* Notification bell */}
        <motion.button
          className="relative p-2 rounded-lg text-text-muted hover:text-text-primary"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* Badge */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: '#EF4444', color: '#fff' }}>
            3
          </span>
        </motion.button>

        {/* User avatar */}
        <div className="relative">
          <motion.button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #F5A623, #D48B0F)', color: '#0D0F14' }}>
              SM
            </div>
            <span className="text-sm text-text-primary font-medium hidden md:block">Smit N.</span>
            <svg className="text-text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  background: 'rgba(20, 22, 30, 0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-sm font-medium text-text-primary">Smit Nayi</p>
                  <p className="text-xs text-text-muted">admin@metamorph.in</p>
                </div>
                <div className="py-1">
                  {['Profile', 'Settings', 'Sign out'].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
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
