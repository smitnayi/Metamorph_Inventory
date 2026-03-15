import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { usePersistedState, useActivityFeed, useAuth } from '../store/useStore';
import { useToast } from '../App';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const emptyGasForm = { type: 'Argon', capacity: '', currentLevel: '', refillDate: '', cost: '' };

export default function UsageMetrics() {
  const [gasData, setGasData] = usePersistedState('gasData', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gasForm, setGasForm] = useState(emptyGasForm);
  const [editingGasId, setEditingGasId] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { isAdmin } = useAuth();

  const gf = (field) => (e) => setGasForm(prev => ({ ...prev, [field]: e.target.value }));

  const saveGas = () => {
    if (!gasForm.capacity || !gasForm.currentLevel) { addToast('Capacity and Current Level are required', 'warning'); return; }
    
    if (editingGasId) {
      setGasData(prev => prev.map(g => g.id === editingGasId ? { ...g, ...gasForm } : g));
      addToast('Gas record updated', 'success');
      logActivity('You', 'updated gas levels for', gasForm.type, 'info');
    } else {
      const newGas = { id: `GAS-${Date.now()}`, ...gasForm, lastUpdated: new Date().toISOString().split('T')[0] };
      setGasData(prev => [...prev, newGas]);
      addToast('Gas record added', 'success');
      logActivity('You', 'logged new gas refill for', gasForm.type, 'success');
    }
    setIsModalOpen(false);
  };

  const deleteGas = (gas) => {
    if (window.confirm('Delete this gas record?')) {
      setGasData(prev => prev.filter(g => g.id !== gas.id));
      addToast('Record deleted', 'info');
      logActivity('You', 'deleted gas record for', gas.type, 'danger');
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Usage Metrics</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Monitor electricity and gas consumption</p>
        </div>
        <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} 
          onClick={() => { setEditingGasId(null); setGasForm(emptyGasForm); setIsModalOpen(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Gas Refill
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="!p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Estimated Electricity Cost (Month)</p>
            <div className="flex items-end gap-3 mt-2">
              <h3 className="text-4xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>₹42,500</h3>
              <span className="text-xs font-medium pb-1 text-emerald-500">↓ 4% vs last month</span>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div><p className="text-[10px] uppercase text-gray-500 mb-1">Total Units</p><p className="font-medium">4,250 kWh</p></div>
              <div><p className="text-[10px] uppercase text-gray-500 mb-1">Peak Load</p><p className="font-medium">45 kW</p></div>
              <div><p className="text-[10px] uppercase text-gray-500 mb-1">Rate</p><p className="font-medium">₹10.0/unit</p></div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21.54 15H17M21 12H16M21.54 9H17M11 20a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8a6 6 0 0 1-6 6zM7 2h4"/></svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Gas Expenses (Month)</p>
            <div className="flex items-end gap-3 mt-2">
              <h3 className="text-4xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                ₹{gasData.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0).toLocaleString()}
              </h3>
              <span className="text-xs font-medium pb-1" style={{ color: 'var(--text-muted)' }}>Based on current logs</span>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div><p className="text-[10px] uppercase text-gray-500 mb-1">Active Cylinders</p><p className="font-medium">{gasData.length}</p></div>
              <div><p className="text-[10px] uppercase text-gray-500 mb-1">Upcoming Refills</p><p className="font-medium text-amber-500">{gasData.filter(g => getDaysUntil(g.refillDate) !== null && getDaysUntil(g.refillDate) <= 7).length} due soon</p></div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--divider)' }}>
          <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Gas Inventory & Logs</h3>
        </div>
        <div className="overflow-x-auto">
          {gasData.length > 0 ? (
            <table className="w-full">
              <thead><tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--divider)' }}>
                {['Gas Type', 'Capacity', 'Current', 'Fill %', 'Refill Due', 'Cost', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                <AnimatePresence>
                  {gasData.map((g, i) => {
                    const fillPct = Math.round((g.currentLevel / g.capacity) * 100);
                    const daysDue = getDaysUntil(g.refillDate);
                    return (
                      <motion.tr key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ borderBottom: '1px solid var(--divider)' }} className="group hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        onClick={() => { setEditingGasId(g.id); setGasForm(g); setIsModalOpen(true); }}>
                        <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{g.type}</td>
                        <td className="px-5 py-3 text-sm font-mono">{g.capacity} L</td>
                        <td className="px-5 py-3 text-sm font-mono text-cyan-500">{g.currentLevel} L</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, fillPct)}%`, background: fillPct > 50 ? '#10B981' : fillPct > 20 ? '#FACC15' : '#F43F5E' }} />
                            </div>
                            <span className="text-xs font-bold font-mono" style={{ color: fillPct > 50 ? '#10B981' : fillPct > 20 ? '#FACC15' : '#F43F5E' }}>{fillPct}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm">
                          {daysDue !== null ? (
                            <span className={`px-2 py-1 rounded text-xs font-bold ${daysDue <= 3 ? 'bg-red-500/20 text-red-500' : daysDue <= 7 ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-500/10 text-gray-500'}`}>
                              {daysDue < 0 ? 'Overdue' : daysDue === 0 ? 'Today' : `in ${daysDue} days`}
                            </span>
                          ) : <span className="text-gray-500">—</span>}
                        </td>
                        <td className="px-5 py-3 font-semibold text-right" style={{ color: 'var(--text-primary)' }}>₹{g.cost || '0'}</td>
                        <td className="px-5 py-3 text-right">
                          {isAdmin && (
                            <motion.button 
                              className="p-1 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                              whileTap={{ scale: 0.9 }}
                              onClick={e => { e.stopPropagation(); deleteGas(g); }}
                              title="Delete Record"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No gas records tracked yet.</div>
          )}
        </div>
      </GlassCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGasId ? "Edit Gas Record" : "Log Gas Refill"} size="sm">
        <div className="space-y-4">
          <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Gas Type *</label>
            <select className="glass-input w-full" value={gasForm.type} onChange={gf('type')}>
              {['Argon', 'Oxygen', 'Nitrogen', 'LPG'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Total Capacity (L) *</label><input type="number" className="glass-input w-full" value={gasForm.capacity} onChange={gf('capacity')} /></div>
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Current Level (L) *</label><input type="number" className="glass-input w-full" value={gasForm.currentLevel} onChange={gf('currentLevel')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Next Refill Target</label><input type="date" className="glass-input w-full text-sm" value={gasForm.refillDate} onChange={gf('refillDate')} /></div>
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Cost (₹)</label><input type="number" className="glass-input w-full" value={gasForm.cost} onChange={gf('cost')} placeholder="e.g. 1500" /></div>
          </div>
          <motion.button className="glass-btn-primary w-full justify-center p-3 mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveGas}>
            {editingGasId ? "Save Changes" : "Save Record"}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
