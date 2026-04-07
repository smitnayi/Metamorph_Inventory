import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useAuth, useActivityFeed } from '../store/useStore';
import { useToast } from '../App';
import { api } from '../services/api';

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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [processing, setProcessing] = useState(false);
  
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { permissions, user } = useAuth();

  const emptyLog = {
    batch_id: '', powder_type: '', inspector: user?.username || '', 
    date: new Date().toISOString().slice(0, 10),
    thickness: '', adhesion: '5B', visual: 'OK', notes: '', result: 'Pass'
  };
  
  const [newLog, setNewLog] = useState(emptyLog);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/qc-reports/');
      setLogs(res);
    } catch (err) {
      addToast('Failed to load QC logs from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'All') return true;
    return log.result === filter;
  });

  const passRate = logs.length > 0 ? Math.round((logs.filter(l => l.result === 'Pass').length / logs.length) * 100) : 100;

  const handleSave = async () => {
    const isFail = (newLog.visual === 'Mottling' || newLog.visual === 'Pinholes' || (newLog.adhesion.includes('B') && parseInt(newLog.adhesion) < 4));
    const finalResult = isFail ? 'Fail' : 'Pass';
    
    if (!newLog.batch_id.trim()) { addToast('Batch ID is required.', 'warning'); return; }
    
    setProcessing(true);
    try {
        const payload = { ...newLog, result: finalResult };
        await api.post('/qc-reports/', payload);
        
        setIsModalOpen(false);
        setNewLog(emptyLog);
        addToast(`Inspection logged — ${finalResult}!`, finalResult === 'Pass' ? 'success' : 'warning');
        logActivity(user.username, `logged ${finalResult} inspection for`, newLog.batch_id, finalResult === 'Pass' ? 'success' : 'danger');
        
        fetchLogs();
    } catch (err) {
        addToast('Failed to save QC Report', 'danger');
    } finally {
        setProcessing(false);
    }
  };

  const handleDelete = async (id, batchId) => {
    if(window.confirm('Are you sure you want to delete this QC report?')) {
        try {
            await api.delete(`/qc-reports/${id}/`);
            addToast('QC Report deleted', 'info');
            fetchLogs();
        } catch (err) {
             addToast('Failed to delete report', 'danger');
        }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Quality Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Monitor part inspections and QC metrics</p>
        </div>
        {permissions.canCreate && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Log New Inspection
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <GlassCard className="md:col-span-4 flex flex-col justify-center">
          <p className="text-sm font-medium mb-1 text-center" style={{ color: 'var(--text-muted)' }}>Overall Pass Rate</p>
          <div className="text-5xl font-bold font-mono text-center flex items-center justify-center gap-2" style={{ color: passRate < 95 ? '#EF4444' : '#10B981' }}>
            {passRate}%
            {passRate < 95 ? <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg> : <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Total Inspections: {logs.length}</p>
        </GlassCard>

        <GlassCard className="md:col-span-8 h-[160px] !p-4 flex flex-col">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Weekly QC Pass/Fail Trend</p>
          <div className="flex-1 w-full relative -left-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} itemStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="passes" stroke="#10B981" strokeWidth={3} dot={{ r: 3, fill: '#10B981' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="fails" stroke="#EF4444" strokeWidth={3} dot={{ r: 3, fill: '#EF4444' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden !p-0">
        <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--divider)', background: 'var(--surface-hover)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Inspection History</h3>
          <div className="flex gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-lg w-full sm:w-auto" style={{ border: '1px solid var(--divider)' }}>
            {['All', 'Pass', 'Fail'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex-1 sm:flex-none ${filter === f ? (f === 'Pass' ? 'bg-emerald-500 text-white shadow-md' : f === 'Fail' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-500 text-white shadow-md') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={filter !== f ? { color: 'var(--text-muted)' } : {}}>{f}</button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Fetching QC reports securely...</div>
          ) : logs.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--divider)', color: 'var(--text-muted)' }}>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">Batch ID</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">Powder</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px] hidden lg:table-cell">Inspector</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px] hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">Result</th>
                  <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px] text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredLogs.map(log => (
                    <Fragment key={log.id}>
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="group hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                        style={{ borderBottom: expandedId === log.id ? 'none' : '1px solid var(--divider)' }}
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                        <td className="px-5 py-4 font-mono font-medium" style={{ color: 'var(--primary)' }}>{log.batch_id}</td>
                        <td className="px-5 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{log.powder_type}</td>
                        <td className="px-5 py-4 hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>{log.inspector}</td>
                        <td className="px-5 py-4 hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                        <td className="px-5 py-4"><ResultBadge result={log.result} /></td>
                        <td className="px-5 py-4 text-right">
                          <button className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors pointer-events-auto" style={{ color: 'var(--text-muted)' }}>
                            <svg className={`w-5 h-5 transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </td>
                      </motion.tr>
                      <AnimatePresence>
                        {expandedId === log.id && (
                          <motion.tr initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ borderBottom: '1px solid var(--divider)' }}>
                            <td colSpan={6} className="p-0">
                              <div className="bg-black/5 dark:bg-white/5 border-t px-6 py-4" style={{ borderColor: 'var(--divider)' }}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div><span className="block mb-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Thickness</span><span style={{ color: 'var(--text-primary)' }} className="font-mono">{log.thickness} μm</span></div>
                                  <div><span className="block mb-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Adhesion</span><span style={{ color: 'var(--text-primary)' }} className="font-mono">{log.adhesion}</span></div>
                                  <div><span className="block mb-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Visual</span><span style={{ color: 'var(--text-primary)' }}>{log.visual}</span></div>
                                  <div><span className="block mb-1 font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</span><span style={{ color: 'var(--text-primary)' }}>{log.notes || '—'}</span></div>
                                </div>
                                {permissions.canDelete && (
                                   <div className="mt-4 flex justify-end">
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(log.id, log.batch_id); }} className="text-xs text-red-500 font-semibold uppercase hover:text-red-600 transition">Delete Record</button>
                                   </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
             <div className="p-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No Quality Control reports exist yet.</div>
          )}
        </div>
      </GlassCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Quality Inspection">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Batch ID</label><input type="text" value={newLog.batch_id} onChange={e => setNewLog({ ...newLog, batch_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} /></div>
            <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Powder Used</label><input type="text" value={newLog.powder_type} onChange={e => setNewLog({ ...newLog, powder_type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Thickness (μm)</label><input type="text" value={newLog.thickness} onChange={e => setNewLog({ ...newLog, thickness: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} /></div>
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Adhesion (ASTM)</label>
               <select value={newLog.adhesion} onChange={e => setNewLog({ ...newLog, adhesion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}>
                 <option value="5B">5B (Best)</option><option value="4B">4B (Pass)</option><option value="3B">3B (Fail)</option><option value="0B">0B (Worst)</option>
               </select>
             </div>
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Visual</label>
               <select value={newLog.visual} onChange={e => setNewLog({ ...newLog, visual: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}>
                 <option value="OK">OK / Smooth</option><option value="Pinholes">Pinholes</option><option value="Mottling">Mottling</option><option value="Orange Peel">Orange Peel</option>
               </select>
             </div>
          </div>
          <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Inspector Notes</label><textarea value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} rows="2" className="w-full border rounded-lg px-3 py-2 text-sm bg-transparent focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}></textarea></div>
          <button disabled={processing} onClick={handleSave} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg text-sm mt-2 transition-colors disabled:opacity-50">
            {processing ? 'Saving...' : 'Submit Inspection Data'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
