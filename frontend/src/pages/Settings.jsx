import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistedState, useCompanyInfo, useNotifications, useTheme, exportCSV } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--divider)' }}>
      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className={`toggle-switch ${checked ? 'active' : ''}`} onClick={onChange} />
    </div>
  );
}

const emptyMember = { name: '', role: '', email: '', status: 'Active' };

export default function Settings() {
  const addToast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [companyInfo, setCompanyInfo] = useCompanyInfo();
  const [notifications, setNotifications] = useNotifications();
  const [teamMembers, setTeamMembers] = usePersistedState('teamMembers', []);
  const [powderStock] = usePersistedState('powderStock', []);
  const [qualityLogs] = usePersistedState('qualityLogs', []);
  const [tasks] = usePersistedState('tasks', []);

  const [memberModal, setMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState(emptyMember);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const mf = (field) => (e) => setMemberForm(prev => ({ ...prev, [field]: e.target.value }));

  // Company info controlled inputs
  const cf = (field) => (e) => setCompanyInfo(prev => ({ ...prev, [field]: e.target.value }));

  const toggleNotif = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openAddMember = () => { setEditingMemberId(null); setMemberForm(emptyMember); setMemberModal(true); };
  const openEditMember = (m) => { setEditingMemberId(m.id); setMemberForm({ name: m.name, role: m.role, email: m.email, status: m.status }); setMemberModal(true); };

  const saveMember = () => {
    if (!memberForm.name.trim()) { addToast('Name is required.', 'warning'); return; }
    if (editingMemberId) {
      setTeamMembers(prev => prev.map(m => m.id === editingMemberId ? { ...m, ...memberForm } : m));
      addToast('Member updated!', 'success');
    } else {
      setTeamMembers(prev => [...prev, { id: Date.now(), ...memberForm, avatar: memberForm.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() }]);
      addToast('Member added!', 'success');
    }
    setMemberModal(false);
  };

  const deleteMember = (id) => { setTeamMembers(prev => prev.filter(m => m.id !== id)); addToast('Member removed.', 'info'); };

  const handleExportPowder = () => {
    if (powderStock.length === 0) { addToast('No powder stock data to export.', 'warning'); return; }
    exportCSV('powder_stock', ['Name', 'SKU', 'Color', 'Stock (kg)', 'Location', 'Batch Date', 'Status'],
      powderStock.map(p => [p.name, p.sku, p.color, p.stock, p.location, p.batchDate, p.status]));
    addToast('Powder Stock CSV downloaded!', 'success');
  };

  const handleExportQuality = () => {
    if (qualityLogs.length === 0) { addToast('No quality data to export.', 'warning'); return; }
    exportCSV('quality_report', ['Batch ID', 'Powder Type', 'Inspector', 'Date', 'Thickness', 'Adhesion', 'Visual', 'Result', 'Notes'],
      qualityLogs.map(q => [q.batchId, q.powderType, q.inspector, q.date, q.thickness, q.adhesion, q.visual, q.result, q.notes]));
    addToast('Quality Report CSV downloaded!', 'success');
  };

  const handleExportTasks = () => {
    if (tasks.length === 0) { addToast('No task data to export.', 'warning'); return; }
    exportCSV('tasks', ['Title', 'Description', 'Priority', 'Status', 'Assignee', 'Created'],
      tasks.map(t => [t.title, t.description, t.priority, t.status, t.assignee, t.createdAt]));
    addToast('Tasks CSV downloaded!', 'success');
  };

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Settings</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage company settings and preferences</p>
      </div>

      {/* Appearance */}
      <GlassCard hover={false} delay={0}>
        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Appearance</h3>
        <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Switch between dark and light mode</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            <div className={`toggle-switch ${theme === 'light' ? 'active' : ''}`} onClick={toggleTheme} />
          </div>
        </div>
      </GlassCard>

      {/* Company Info */}
      <GlassCard hover={false} delay={0.05}>
        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Company Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-heading font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #F5A623, #D48B0F)', color: '#0D0F14' }}>MM</div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{companyInfo.name || 'Company Name'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Industrial Powder Coating & Metal Protection</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Company Name</label><input className="glass-input w-full" value={companyInfo.name} onChange={cf('name')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label><input className="glass-input w-full" placeholder="info@company.com" value={companyInfo.email} onChange={cf('email')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Phone</label><input className="glass-input w-full" placeholder="+91..." value={companyInfo.phone} onChange={cf('phone')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Location</label><input className="glass-input w-full" placeholder="Ahmedabad, Gujarat" value={companyInfo.location} onChange={cf('location')} /></div>
          </div>
          <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => addToast('Company info saved!', 'success')}>Save Changes</motion.button>
        </div>
      </GlassCard>

      {/* Team Members */}
      <GlassCard hover={false} delay={0.1}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Team Members</h3>
          <motion.button className="glass-btn-primary text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAddMember}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </motion.button>
        </div>
        <div className="space-y-2">
          {teamMembers.length > 0 ? teamMembers.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ borderBottom: '1px solid var(--divider)' }}
              onClick={() => openEditMember(member)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>{member.avatar}</div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.role} {member.email && `· ${member.email}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${member.status === 'Active' ? 'badge-success' : 'badge-warning'} text-[10px]`}>{member.status}</span>
                <motion.button className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }} whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); deleteMember(member.id); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </motion.button>
              </div>
            </motion.div>
          )) : (
            <div className="empty-state !py-8">
              <p className="text-sm">No team members added yet</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard hover={false} delay={0.15}>
        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
        <Toggle label="Low stock alerts" checked={notifications.lowStock} onChange={() => toggleNotif('lowStock')} />
        <Toggle label="Quality check failures" checked={notifications.qualityFailures} onChange={() => toggleNotif('qualityFailures')} />
        <Toggle label="Task assignment notifications" checked={notifications.taskAssignments} onChange={() => toggleNotif('taskAssignments')} />
        <Toggle label="Gas refill reminders" checked={notifications.gasRefill} onChange={() => toggleNotif('gasRefill')} />
        <Toggle label="Daily summary email" checked={notifications.dailySummary} onChange={() => toggleNotif('dailySummary')} />
        <Toggle label="Weekly analytics report" checked={notifications.weeklyReport} onChange={() => toggleNotif('weeklyReport')} />
      </GlassCard>

      {/* Data Export */}
      <GlassCard hover={false} delay={0.2}>
        <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Data Export</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Download your data as CSV files.</p>
        <div className="flex gap-3 flex-wrap">
          <motion.button className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportPowder}>
            📦 Powder Stock ({powderStock.length})
          </motion.button>
          <motion.button className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportQuality}>
            🧪 Quality Report ({qualityLogs.length})
          </motion.button>
          <motion.button className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleExportTasks}>
            ✅ Tasks ({tasks.length})
          </motion.button>
        </div>
      </GlassCard>

      {/* Clear Data */}
      <GlassCard hover={false} delay={0.25}>
        <h3 className="font-heading font-semibold text-base mb-2" style={{ color: 'var(--text-primary)' }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Clear all stored data. This cannot be undone.</p>
        <motion.button className="glass-btn text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
          onClick={() => {
            if (confirm('Are you sure? This will delete ALL your data.')) {
              Object.keys(localStorage).filter(k => k.startsWith('mm_')).forEach(k => localStorage.removeItem(k));
              window.location.reload();
            }
          }}>
          🗑️ Clear All Data
        </motion.button>
      </GlassCard>

      {/* Add/Edit Member Modal */}
      <Modal isOpen={memberModal} onClose={() => setMemberModal(false)} title={editingMemberId ? 'Edit Team Member' : 'Add Team Member'}>
        <div className="space-y-4">
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Name *</label><input className="glass-input w-full" placeholder="Full name" value={memberForm.name} onChange={mf('name')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Role</label><input className="glass-input w-full" placeholder="e.g. QC Inspector" value={memberForm.role} onChange={mf('role')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label><input className="glass-input w-full" placeholder="email@company.com" value={memberForm.email} onChange={mf('email')} /></div>
          </div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select className="glass-input w-full" value={memberForm.status} onChange={mf('status')}><option>Active</option><option>Inactive</option></select>
          </div>
          <motion.button className="glass-btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveMember}>{editingMemberId ? 'Update Member' : 'Add Member'}</motion.button>
        </div>
      </Modal>
    </div>
  );
}
