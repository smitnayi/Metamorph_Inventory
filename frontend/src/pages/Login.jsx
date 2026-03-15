import { motion } from 'framer-motion';
import { useAuth } from '../store/useStore';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 w-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8771A] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00D4FF] rounded-full mix-blend-multiply filter blur-[128px] opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #E8771A, #C96410)', color: '#FFFFFF', boxShadow: '0 8px 32px rgba(232, 119, 26, 0.4)' }}>
              MM
            </div>
          </div>
          
          <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Metamorph</h1>
          <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>Operations Dashboard Access</p>

          <div className="space-y-4">
            <button
              onClick={() => login('admin')}
              className="w-full relative group overflow-hidden rounded-xl p-4 flex items-center justify-between transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, rgba(232, 119, 26, 0.1) 0%, transparent 100%)' }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232, 119, 26, 0.15)', color: '#E8771A' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Admin Server</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Full system access & logs</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#E8771A' }} className="relative z-10 transform group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>

            <button
              onClick={() => login('operator')}
              className="w-full relative group overflow-hidden rounded-xl p-4 flex items-center justify-between transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)' }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, transparent 100%)' }}></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Operator Terminal</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Shop floor data entry only</p>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00D4FF' }} className="relative z-10 transform group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          <div className="mt-8 text-xs flex justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Demo mode (No password required)
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
