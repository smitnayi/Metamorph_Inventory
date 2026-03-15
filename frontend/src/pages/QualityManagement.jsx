import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { usePersistedState, useActivityFeed, useAuth } from '../store/useStore';
import { useToast } from '../App';

function ResultBadge({ result }) {
  return result === 'Pass'
    ? <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border bg-emerald-500/20 text-emerald-500 border-emerald-500/30">PASS</span>
    : <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border bg-red-500/20 text-red-500 border-red-500/30">FAIL</span>;
}

const trendData = [
  { day: 'Mon', passes: 45, fails: 2 }, { day: 'Tue', passes: 52, fails: 1 }, { day: 'Wed', passes: 48, fails: 3 },
  { day: 'Thu', passes: 61, fails: 0 }, { day: 'Fri', passes: 55, fails: 4 }, { day: 'Sat', passes: 30, fails: 1 }
];

export default function QualityManagement() {
  const [logs, setLogs] = usePersistedState('qualityLogs', []);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { isAdmin } = useAuth();

  const [newLog, setNewLog] = useState({
    batchId: '', powderType: '', inspector: '', date: new Date().toISOString().slice(0, 10),
    thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass'
  });

  const filteredLogs = logs.filter(log => {
    if (filter === 'All') return true;
    return log.result === filter;
  });

  const passRate = logs.length > 0 ? Math.round((logs.filter(l => l.result === 'Pass').length / logs.length) * 100) : 100;

  const handleSave = () => {
    const result = (newLog.visual === 'Mottling' || newLog.visual === 'Pinholes' || newLog.adhesion.includes('B') && parseInt(newLog.adhesion) < 4) ? 'Fail' : 'Pass';
    if (!newLog.batchId.trim()) { addToast('Batch ID is required.', 'warning'); return; }
    const entry = { id: `QC-${String(logs.length + 1).padStart(3, '0')}`, ...newLog, result };
    setLogs(prev => [entry, ...prev]);
    setIsModalOpen(false);
    setNewLog({ batchId: '', powderType: '', inspector: '', date: new Date().toISOString().slice(0, 10), thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass' });
    addToast(`Inspection logged — ${result}!`, result === 'Pass' ? 'success' : 'warning');
    logActivity('You', `logged ${result} inspection for`, newLog.batchId, result === 'Pass' ? 'success' : 'danger');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this inspection log?')) {
      setLogs(prev => prev.filter(log => log.id !== id));
      addToast('Inspection log deleted.', 'info');
      logActivity('You', 'deleted an inspection log', id, 'danger');
    }
  };

  const nf = (field) => (e) => setNewLog(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Quality Management</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Inspection logs and quality trends</p>
        </div>
        <motion.button className="glass-btn-primary text-sm shadow-xl" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Inspection
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="!p-5">
          <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Pass Rate (All Time)</p>
          <div className="flex items-end gap-3 mt-2">
            <h3 className="text-4xl font-heading font-bold" style={{ color: passRate < 90 ? '#F43F5E' : '#10B981' }}>{passRate}%</h3>
            <span className="text-xs font-medium pb-1" style={{ color: 'var(--text-muted)' }}>{logs.filter(l => l.result === 'Pass').length}/{logs.length} passing</span>
          </div>
        </GlassCard>
        
        <GlassCard className="!p-5 col-span-1 md:col-span-2 flex flex-col">
          <p className="text-xs uppercase font-semibold mb-3 shrink-0" style={{ color: 'var(--text-muted)' }}>Last 7 Days Trend</p>
          <div className="flex-1 min-h-[100px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: 'var(--modal-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="passes" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="fails" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3, fill: '#F43F5E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="flex gap-2">
        {['All', 'Pass', 'Fail'].map(f => (
          <motion.button key={f} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'glass-btn'}`}
            onClick={() => setFilter(f)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{f}</motion.button>
        ))}
      </div>

      <GlassCard className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--divider)' }}>
                {['Batch ID', 'Powder Type', 'Date', 'Result', 'Notes', ''].map((h, i) => (
                  <th key={i} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    {logs.length === 0 ? "No quality inspections logged yet." : "No logs matching this filter."}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <Fragment key={log.id}>
                    <motion.tr initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="cursor-pointer" style={{ borderBottom: '1px solid var(--divider)' }}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      whileHover={{ backgroundColor: 'var(--surface-hover)' }}>
                      <td className="px-5 py-3 text-sm font-mono" style={{ color: '#00D4FF' }}>{log.batchId}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{log.powderType}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                      <td className="px-5 py-3"><ResultBadge result={log.result} /></td>
                      <td className="px-5 py-3 text-sm truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{log.notes}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end">
                          <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ color: 'var(--text-muted)' }} animate={{ rotate: expandedId === log.id ? 180 : 0 }}>
                            <polyline points="6 9 12 15 18 9" />
                          </motion.svg>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                              className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition-colors ml-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedId === log.id && (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <td colSpan={6} className="px-5 pb-4 pt-1" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--divider)' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div><p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Thickness (μm)</p><p className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{log.thickness || 'N/A'}</p></div>
                              <div><p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Cross-hatch Adhesion</p><p className="text-sm font-bold" style={{ color: log.adhesion === '5B' ? '#10B981' : '#FACC15' }}>{log.adhesion}</p></div>
                              <div><p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Visual Inspection</p><p className="text-sm" style={{ color: log.visual === 'OK' ? '#10B981' : '#F43F5E' }}>{log.visual}</p></div>
                              <div><p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Inspector</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{log.inspector}</p></div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Inspection" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Batch ID *</label><input className="glass-input w-full" placeholder="B2026-0315" value={newLog.batchId} onChange={nf('batchId')} /></div>
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Powder Type</label><input className="glass-input w-full" placeholder="e.g. Matte Black" value={newLog.powderType} onChange={nf('powderType')} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y py-4 my-2" style={{ borderColor: 'var(--glass-border)' }}>
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Thickness (μm)</label><input type="number" className="glass-input w-full font-mono" placeholder="60-80" value={newLog.thickness} onChange={nf('thickness')} /></div>
            <div>
              <label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Adhesion Check</label>
              <select className="glass-input w-full" value={newLog.adhesion} onChange={nf('adhesion')}>
                {['5B', '4B', '3B', '2B', '1B', '0B'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Visual Check</label>
              <select className="glass-input w-full" value={newLog.visual} onChange={nf('visual')}>
                <option value="OK">OK (No defects)</option><option value="Orange Peel">Orange Peel</option><option value="Mottling">Mottling</option><option value="Pinholes">Pinholes</option>
              </select>
            </div>
          </div>
          <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Inspector Name</label><input className="glass-input w-full" placeholder="Your name" value={newLog.inspector} onChange={nf('inspector')} /></div>
          <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Additional Notes</label><textarea className="glass-input w-full min-h-[80px]" placeholder="Any special observations?" value={newLog.notes} onChange={nf('notes')} /></div>
          <motion.button className="glass-btn-primary w-full justify-center p-3 mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}>Submit QC Report</motion.button>
        </div>
      </Modal>
    </div>
  );
}
