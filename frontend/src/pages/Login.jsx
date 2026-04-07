import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../store/useStore';
import { api } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [formData, setFormData] = useState({ username: '', password: '', email: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        if (!formData.username || !formData.password) throw new Error("Please enter all fields");
        const res = await login(formData.username, formData.password);
        if (!res.success) throw new Error(res.error || "Invalid credentials");
      } else {
        if (!formData.username || !formData.password || !formData.email) throw new Error("Please fill out required fields");
        // Register Call
        await api.register({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'operator' // Defaults to operator for new signups
        });
        
        // Auto login after register
        const res = await login(formData.username, formData.password);
        if (!res.success) throw new Error("Registration succeeded but auto-login failed.");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
         style={{ background: 'var(--bg-primary)' }}>
         
      {/* Animated Background Mesh */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-zinc-600/30 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.img 
             initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
             src="/logo.png" alt="Metamorph Logo" className="h-16 mx-auto mb-6" 
          />
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
             {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl border" 
              style={{ background: 'var(--surface)', borderColor: 'var(--glass-border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required
                     className="w-full bg-black/5 dark:bg-white/5 border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm transition-colors"
                     style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="johndoe" />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                         className="w-full bg-black/5 dark:bg-white/5 border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                         style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="john@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                           className="w-full bg-black/5 dark:bg-white/5 border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                           style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                           className="w-full bg-black/5 dark:bg-white/5 border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                           style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
              </div>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required
                     className="w-full bg-black/5 dark:bg-white/5 border px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                     style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="••••••••" />
            </div>
          </div>

          <motion.button 
             whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
             disabled={loading} type="submit"
             className="w-full mt-8 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(234,88,12,0.3)] disabled:opacity-50">
             {loading ? <span className="animate-pulse">Authenticating...</span> : (isLogin ? 'Sign In' : 'Create Account')}
          </motion.button>
        </form>

        <p className="text-center mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
           {isLogin ? "Don't have an account? " : "Already have an account? "}
           <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-orange-500 hover:text-orange-400 transition-colors">
              {isLogin ? 'Register' : 'Log In'}
           </button>
        </p>

      </motion.div>
    </div>
  );
}
