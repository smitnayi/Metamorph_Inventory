import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistedState, useActivityFeed } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function ResultBadge({ result }) {
  return result === 'Pass'
    ? <span className="badge badge-success">✓ PASS</span>
    : <span className="badge badge-danger">✕ FAIL</span>;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--modal-bg)', border: '1px solid var(--glass-border)' }}>
      <p style={{ color: 'var(--text-muted)' }} className="mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function QualityManagement() {
  const [logs, setLogs] = usePersistedState('qualityLogs', []);
  const [expandedRow, setExpandedRow] = useState(null);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const addToast = useToast();
  const { logActivity } = useActivityFeed();

  const [newLog, setNewLog] = useState({
    batchId: '', powderType: '', inspector: '', date: new Date().toISOString().slice(0, 10),
    thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass',
  });
  const nf = (field) => (e) => setNewLog(prev => ({ ...prev, [field]: e.target.value }));

  const totalInspections = logs.length;
  const passCount = logs.filter(q => q.result === 'Pass').length;
  const failCount = logs.filter(q => q.result === 'Fail').length;
  const passRate = totalInspections > 0 ? ((passCount / totalInspections) * 100).toFixed(1) : '0.0';

  const filtered = filter === 'All' ? logs : logs.filter(q => q.result === filter);

  // Build trend data from logs by date
  const trendMap = {};
  logs.forEach(l => {
    if (!trendMap[l.date]) trendMap[l.date] = { date: l.date, passed: 0, failed: 0 };
    l.result === 'Pass' ? trendMap[l.date].passed++ : trendMap[l.date].failed++;
  });
  const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  const submitInspection = (result) => {
    if (!newLog.batchId.trim()) { addToast('Batch ID is required.', 'warning'); return; }
    const entry = { id: `QC-${String(logs.length + 1).padStart(3, '0')}`, ...newLog, result };
    setLogs(prev => [entry, ...prev]);
    setInspectionModal(false);
    setNewLog({ batchId: '', powderType: '', inspector: '', date: new Date().toISOString().slice(0, 10), thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass' });
    addToast(`Inspection logged — ${result}!`, result === 'Pass' ? 'success' : 'warning');
    logActivity('You', `logged ${result} inspection for`, newLog.batchId, result === 'Pass' ? 'success' : 'danger');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Quality Management</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Inspection logs and quality trends</p>
        </div>
        <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setInspectionModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Inspection
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inspections', value: totalInspections, color: '#00D4FF' },
          { label: 'Pass Rate', value: `${passRate}%`, color: '#22C55E' },
          { label: 'Failed Batches', value: failCount, color: '#EF4444' },
          { label: 'Passed Batches', value: passCount, color: '#E8771A' },
        ].map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.05} className="!p-4">
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </GlassCard>
        ))}
      </div>

      {trendData.length > 1 && (
        <GlassCard hover={false} delay={0.1}>
          <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Quality Trend</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="passed" stroke="#22C55E" strokeWidth={2} dot={false} name="Passed" />
                <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name="Failed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}

      <div className="flex gap-2">
        {['All', 'Pass', 'Fail'].map(f => (
          <motion.button key={f} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-amber/20 text-amber border border-amber/30' : 'glass-btn'}`}
            whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}>{f}</motion.button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-muted)' }}>{filtered.length} records</span>
      </div>

      <GlassCard hover={false} delay={0.15} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Batch ID', 'Powder Type', 'Inspector', 'Date', 'Result', 'Notes', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((log, i) => (
                <Fragment key={log.id}>
                  <motion.tr initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="cursor-pointer" style={{ borderBottom: '1px solid var(--divider)' }}
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    whileHover={{ backgroundColor: 'var(--surface-hover)' }}>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: '#00D4FF' }}>{log.batchId}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>{log.powderType}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{log.inspector}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                    <td className="px-5 py-3"><ResultBadge result={log.result} /></td>
                    <td className="px-5 py-3 text-sm truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>{log.notes}</td>
                    <td className="px-5 py-3">
                      <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ color: 'var(--text-muted)' }} animate={{ rotate: expandedRow === log.id ? 180 : 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </td>
                  </motion.tr>
                  <AnimatePresence>
                    {expandedRow === log.id && (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={7} className="px-5 pb-4 pt-1" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--divider)' }}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {[{ l: 'Thickness', v: log.thickness || '—' }, { l: 'Adhesion', v: log.adhesion || '—' }, { l: 'Visual', v: log.visual || '—' }, { l: 'Full Notes', v: log.notes || '—' }].map(d => (
                              <div key={d.l}><p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{d.l}</p><p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{d.v}</p></div>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p className="text-sm">{logs.length === 0 ? 'No inspections logged yet' : 'No records match your filter'}</p>
          </div>
        )}
      </GlassCard>

      <Modal isOpen={inspectionModal} onClose={() => setInspectionModal(false)} title="Log New Inspection" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Batch ID *</label><input className="glass-input w-full" placeholder="B2026-0315" value={newLog.batchId} onChange={nf('batchId')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Powder Type</label><input className="glass-input w-full" placeholder="e.g. RAL 9010 Pure White" value={newLog.powderType} onChange={nf('powderType')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Inspector</label><input className="glass-input w-full" placeholder="Inspector name" value={newLog.inspector} onChange={nf('inspector')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Date</label><input type="date" className="glass-input w-full" value={newLog.date} onChange={nf('date')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Thickness (μm)</label><input className="glass-input w-full" placeholder="72" value={newLog.thickness} onChange={nf('thickness')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Adhesion</label>
              <select className="glass-input w-full" value={newLog.adhesion} onChange={nf('adhesion')}><option>5B</option><option>4B</option><option>3B</option><option>2B</option><option>1B</option></select>
            </div>
          </div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Notes</label><textarea className="glass-input w-full h-20" placeholder="Inspection notes…" value={newLog.notes} onChange={nf('notes')} /></div>
          <div className="flex gap-3">
            <motion.button className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => submitInspection('Pass')}>✓ Log as PASS</motion.button>
            <motion.button className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => submitInspection('Fail')}>✕ Log as FAIL</motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
