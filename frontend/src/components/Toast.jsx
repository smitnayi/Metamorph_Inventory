import { motion } from 'framer-motion';

export default function Toast({ id, message, type = 'success', onClose }) {
  const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', text: '#22C55E', icon: '✓' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#EF4444', icon: '✕' },
    warning: { bg: 'rgba(250, 204, 21, 0.15)', border: 'rgba(250, 204, 21, 0.3)', text: '#FACC15', icon: '!' },
    info: { bg: 'rgba(0, 212, 255, 0.15)', border: 'rgba(0, 212, 255, 0.3)', text: '#00D4FF', icon: 'i' },
  };

  const c = colors[type] || colors.success;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] shadow-lg"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(20px)',
      }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: `${c.text}20`, color: c.text }}>
        {c.icon}
      </span>
      <span className="text-sm text-text-primary font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xs">✕</button>
    </motion.div>
  );
}
