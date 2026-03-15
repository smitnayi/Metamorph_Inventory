import { useState } from 'react';
import { motion } from 'framer-motion';
import { teamMembers } from '../data/mockData';
import GlassCard from '../components/GlassCard';
import { useToast } from '../App';

function Toggle({ label, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-sm text-text-primary">{label}</span>
      <div className={`toggle-switch ${on ? 'active' : ''}`} onClick={() => setOn(!on)} />
    </div>
  );
}

export default function Settings() {
  const addToast = useToast();

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Settings</h2>
        <p className="text-text-muted text-sm mt-1">Manage company settings and preferences</p>
      </div>

      {/* Company Info */}
      <GlassCard hover={false} delay={0}>
        <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Company Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-heading font-bold text-xl" style={{ background: 'linear-gradient(135deg, #F5A623, #D48B0F)', color: '#0D0F14' }}>MM</div>
            <div>
              <p className="text-sm text-text-primary font-medium">Metamorph Metal Protect LLP</p>
              <p className="text-xs text-text-muted">Industrial Powder Coating & Metal Protection</p>
              <motion.button className="text-xs text-amber mt-1 hover:underline" whileTap={{ scale: 0.97 }}>Change logo</motion.button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Company Name</label><input className="glass-input w-full" defaultValue="Metamorph Metal Protect LLP" /></div>
            <div><label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Email</label><input className="glass-input w-full" defaultValue="info@metamorph.in" /></div>
            <div><label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Phone</label><input className="glass-input w-full" defaultValue="+91 98765 43210" /></div>
            <div><label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Location</label><input className="glass-input w-full" defaultValue="Ahmedabad, Gujarat" /></div>
          </div>
          <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => addToast('Company info updated!', 'success')}>Save Changes</motion.button>
        </div>
      </GlassCard>

      {/* User Management */}
      <GlassCard hover={false} delay={0.05}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-base text-text-primary">Team Members</h3>
          <motion.button className="glass-btn-primary text-xs flex items-center gap-1.5" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </motion.button>
        </div>
        <div className="space-y-2">
          {teamMembers.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>{member.avatar}</div>
                <div>
                  <p className="text-sm text-text-primary font-medium">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.role} · {member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success text-[10px]">{member.status}</span>
                <motion.button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5" whileTap={{ scale: 0.9 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard hover={false} delay={0.1}>
        <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Notification Preferences</h3>
        <Toggle label="Low stock alerts" defaultOn={true} />
        <Toggle label="Quality check failures" defaultOn={true} />
        <Toggle label="Task assignment notifications" defaultOn={true} />
        <Toggle label="Gas refill reminders" defaultOn={true} />
        <Toggle label="Daily summary email" defaultOn={false} />
        <Toggle label="Weekly analytics report" defaultOn={true} />
      </GlassCard>

      {/* Data Export */}
      <GlassCard hover={false} delay={0.15}>
        <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Data Export</h3>
        <p className="text-sm text-text-muted mb-4">Download your data in various formats for reporting.</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Powder Stock CSV', icon: '📦' },
            { label: 'Quality Report PDF', icon: '🧪' },
            { label: 'Usage Analytics CSV', icon: '📊' },
            { label: 'Full Backup ZIP', icon: '💾' },
          ].map(btn => (
            <motion.button key={btn.label} className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => addToast(`${btn.label} download started`, 'info')}>
              <span>{btn.icon}</span>{btn.label}
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
