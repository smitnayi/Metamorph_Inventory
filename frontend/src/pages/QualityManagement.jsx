import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { qualityLogs as initialLogs, qualityTrendData } from '../data/mockData';
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
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(18,20,30,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function QualityManagement() {
  const [logs, setLogs] = useState(initialLogs);
  const [expandedRow, setExpandedRow] = useState(null);
  const [inspectionModal, setInspectionModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const addToast = useToast();

  // New inspection form
  const [newLog, setNewLog] = useState({
    batchId: '', powderType: 'RAL 9010 Pure White', inspector: 'Priya Shah',
    date: new Date().toISOString().slice(0, 10), thickness: '', adhesion: '5B',
    visual: 'OK', notes: '', result: 'Pass',
  });
  const nf = (field) => (e) => setNewLog((prev) => ({ ...prev, [field]: e.target.value }));

  const totalInspections = logs.length;
  const passCount = logs.filter((q) => q.result === 'Pass').length;
  const failCount = logs.filter((q) => q.result === 'Fail').length;
  const passRate = totalInspections > 0 ? ((passCount / totalInspections) * 100).toFixed(1) : '0.0';

  const filtered = filter === 'All' ? logs : logs.filter((q) => q.result === filter);

  const submitInspection = (result) => {
    if (!newLog.batchId.trim()) { addToast('Batch ID is required.', 'warning'); return; }
    const entry = {
      id: `QC-${String(logs.length + 1).padStart(3, '0')}`,
      ...newLog,
      result,
    };
    setLogs((prev) => [entry, ...prev]);
    setInspectionModal(false);
    setNewLog({ batchId: '', powderType: 'RAL 9010 Pure White', inspector: 'Priya Shah', date: new Date().toISOString().slice(0, 10), thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass' });
    addToast(`Inspection logged — ${result}!`, result === 'Pass' ? 'success' : 'warning');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Quality Management</h2>
          <p className="text-text-muted text-sm mt-1">Inspection logs and quality trends</p>
        </div>
        <motion.button className="glass-btn-primary text-sm flex items-center gap-2"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setInspectionModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Log Inspection
        </motion.button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inspections', value: totalInspections, color: '#00D4FF' },
          { label: 'Pass Rate', value: `${passRate}%`, color: '#22C55E' },
          { label: 'Failed Batches', value: failCount, color: '#EF4444' },
          { label: 'Pending Reviews', value: 2, color: '#F5A623' },
        ].map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.05} className="!p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{kpi.label}</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Trend chart */}
      <GlassCard hover={false} delay={0.1}>
        <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Quality Trend — Last 30 Days</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={qualityTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="passed" stroke="#22C55E" strokeWidth={2} dot={false} animationDuration={1500} name="Passed" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} animationDuration={1500} name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Filter */}
      <div className="flex gap-2">
        {['All', 'Pass', 'Fail'].map((f) => (
          <motion.button key={f}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-amber/20 text-amber border border-amber/30' : 'text-text-muted hover:text-text-primary glass-btn'}`}
            whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}>{f}
          </motion.button>
        ))}
        <span className="ml-auto text-xs text-text-muted self-center">{filtered.length} records</span>
      </div>

      {/* Table */}
      <GlassCard hover={false} delay={0.15} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Batch ID', 'Powder Type', 'Inspector', 'Date', 'Result', 'Notes', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <>
                  <motion.tr key={log.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: '#00D4FF' }}>{log.batchId}</td>
                    <td className="px-5 py-3 text-sm text-text-primary">{log.powderType}</td>
                    <td className="px-5 py-3 text-sm text-text-muted">{log.inspector}</td>
                    <td className="px-5 py-3 text-sm text-text-muted">{log.date}</td>
                    <td className="px-5 py-3"><ResultBadge result={log.result} /></td>
                    <td className="px-5 py-3 text-sm text-text-muted truncate max-w-[180px]">{log.notes}</td>
                    <td className="px-5 py-3">
                      <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" className="text-text-muted"
                        animate={{ rotate: expandedRow === log.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </td>
                  </motion.tr>

                  {/* Expanded detail row */}
                  <AnimatePresence>
                    {expandedRow === log.id && (
                      <motion.tr key={`detail-${log.id}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        <td colSpan={7} className="px-5 pb-4 pt-1" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {[
                              { l: 'Thickness', v: log.thickness },
                              { l: 'Adhesion', v: log.adhesion },
                              { l: 'Visual', v: log.visual },
                              { l: 'Full Notes', v: log.notes },
                            ].map((d) => (
                              <div key={d.l}>
                                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{d.l}</p>
                                <p className="text-sm font-mono text-text-primary">{d.v}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-text-muted text-sm">No records found.</div>
        )}
      </GlassCard>

      {/* Log Inspection Modal */}
      <Modal isOpen={inspectionModal} onClose={() => setInspectionModal(false)} title="Log New Inspection" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Batch ID *</label>
              <input className="glass-input w-full" placeholder="B2026-0315" value={newLog.batchId} onChange={nf('batchId')} />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Powder Type</label>
              <select className="glass-input w-full" value={newLog.powderType} onChange={nf('powderType')}>
                <option>RAL 9010 Pure White</option><option>RAL 9005 Jet Black</option>
                <option>RAL 3020 Traffic Red</option><option>RAL 5015 Sky Blue</option>
                <option>RAL 7035 Light Grey</option><option>RAL 2004 Pure Orange</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Inspector</label>
              <select className="glass-input w-full" value={newLog.inspector} onChange={nf('inspector')}>
                <option>Priya Shah</option><option>Raj Mehta</option><option>Amit Kumar</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Date</label>
              <input type="date" className="glass-input w-full" value={newLog.date} onChange={nf('date')} />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Thickness (μm)</label>
              <input className="glass-input w-full" placeholder="72" value={newLog.thickness} onChange={nf('thickness')} />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Adhesion</label>
              <select className="glass-input w-full" value={newLog.adhesion} onChange={nf('adhesion')}>
                <option>5B</option><option>4B</option><option>3B</option><option>2B</option><option>1B</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">Notes</label>
            <textarea className="glass-input w-full h-20" placeholder="Inspection notes…"
              value={newLog.notes} onChange={nf('notes')} />
          </div>
          <div className="flex gap-3">
            <motion.button
              className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => submitInspection('Pass')}>
              ✓ Log as PASS
            </motion.button>
            <motion.button
              className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => submitInspection('Fail')}>
              ✕ Log as FAIL
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
