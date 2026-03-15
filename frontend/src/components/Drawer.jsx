import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function Drawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--overlay)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-md h-full overflow-y-auto"
            style={{
              background: 'var(--drawer-bg)',
              borderLeft: '1px solid var(--glass-border)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
            }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ borderBottom: '1px solid var(--divider)', background: 'var(--drawer-bg)' }}>
              <h3 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <motion.button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}
                whileHover={{ backgroundColor: 'var(--btn-bg)' }} whileTap={{ scale: 0.9 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
