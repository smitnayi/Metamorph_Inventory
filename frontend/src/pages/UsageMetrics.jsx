import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePersistedState, useActivityFeed } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--modal-bg)', border: '1px solid var(--glass-border)' }}>
      <p style={{ color: 'var(--text-muted)' }} className="mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

const emptyGas = { type: '', capacity: '', current: '', unit: 'm³', refillDate: '' };

export default function UsageMetrics() {
  const [powderStock] = usePersistedState('powderStock', []);
  const [gasData, setGasData] = usePersistedState('gasData', []);
  const [gasModal, setGasModal] = useState(false);
  const [gasForm, setGasForm] = useState(emptyGas);
  const [editingGasId, setEditingGasId] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();

  const gf = (field) => (e) => setGasForm(prev => ({ ...prev, [field]: e.target.value }));

  const totalPowder = powderStock.reduce((s, p) => s + Number(p.stock || 0), 0);
  const totalGas = gasData.reduce((s, g) => s + Number(g.current || 0), 0);
  const totalGasCapacity = gasData.reduce((s, g) => s + Number(g.capacity || 0), 0);

  // Powder by status bar chart
  const statusCounts = {};
  powderStock.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + Number(p.stock || 0); });
  const powderChart = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const openAddGas = () => { setEditingGasId(null); setGasForm(emptyGas); setGasModal(true); };
  const openEditGas = (g) => { setEditingGasId(g.id); setGasForm({ type: g.type, capacity: g.capacity, current: g.current, unit: g.unit, refillDate: g.refillDate || '' }); setGasModal(true); };

  const saveGas = () => {
    if (!gasForm.type.trim()) { addToast('Gas type is required.', 'warning'); return; }
    if (editingGasId) {
      setGasData(prev => prev.map(g => g.id === editingGasId ? { ...g, ...gasForm, capacity: Number(gasForm.capacity) || 0, current: Number(gasForm.current) || 0 } : g));
      addToast('Gas tank updated!', 'success');
      logActivity('You', 'updated gas tank', gasForm.type, 'info');
    } else {
      setGasData(prev => [...prev, { id: Date.now(), ...gasForm, capacity: Number(gasForm.capacity) || 0, current: Number(gasForm.current) || 0 }]);
      addToast('Gas tank added!', 'success');
      logActivity('You', 'added gas tank', gasForm.type, 'success');
    }
    setGasModal(false);
  };

  const deleteGas = (g) => { setGasData(prev => prev.filter(x => x.id !== g.id)); addToast('Gas tank removed.', 'info'); logActivity('You', 'removed gas tank', g.type, 'danger'); };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Usage Metrics</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Powder consumption and gas usage analytics</p>
        </div>
        <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAddGas}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Gas Tank
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Powder Stock', value: `${totalPowder.toLocaleString()} kg`, color: '#00D4FF' },
          { label: 'Powder SKUs', value: powderStock.length, color: '#E8771A' },
          { label: 'Gas Remaining', value: `${totalGas} m³`, color: '#22C55E' },
          { label: 'Gas Tanks', value: gasData.length, color: '#A78BFA' },
        ].map((t, i) => (
          <GlassCard key={t.label} delay={i * 0.05} className="!p-4">
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>{t.label}</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: t.color }}>{t.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard hover={false} delay={0.1}>
          <h3 className="font-heading font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Powder Stock by Status</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Total kg by stock status</p>
          {powderChart.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={powderChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#00D4FF" radius={[4, 4, 0, 0]} name="Stock (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><p className="text-sm">No powder stock data</p><p className="text-xs mt-1 opacity-60">Add entries in Powder Stock page</p></div>
          )}
        </GlassCard>

        <GlassCard hover={false} delay={0.15}>
          <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Gas Tank Status</h3>
          {gasData.length > 0 ? (
            <table className="w-full">
              <thead><tr style={{ borderBottom: '1px solid var(--divider)' }}>
                {['Gas Type', 'Capacity', 'Current', 'Fill %', 'Refill Due', ''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {gasData.map((g, i) => {
                  const pct = g.capacity > 0 ? Math.round((g.current / g.capacity) * 100) : 0;
                  const color = pct > 50 ? '#22C55E' : pct > 25 ? '#FACC15' : '#EF4444';
                  return (
                    <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      style={{ borderBottom: '1px solid var(--divider)' }} className="cursor-pointer"
                      onClick={() => openEditGas(g)} whileHover={{ backgroundColor: 'var(--surface-hover)' }}>
                      <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-primary)' }}>{g.type}</td>
                      <td className="px-3 py-2.5 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{g.capacity} {g.unit}</td>
                      <td className="px-3 py-2.5 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{g.current} {g.unit}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface)' }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
                          <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>{g.refillDate || '—'}</td>
                      <td className="px-3 py-2.5">
                        <motion.button style={{ color: 'var(--text-muted)' }} whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); deleteGas(g); }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg><p className="text-sm">No gas tanks</p><p className="text-xs mt-1 opacity-60">Click "Add Gas Tank" to get started</p></div>
          )}
        </GlassCard>
      </div>

      <Modal isOpen={gasModal} onClose={() => setGasModal(false)} title={editingGasId ? 'Edit Gas Tank' : 'Add Gas Tank'}>
        <div className="space-y-4">
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Gas Type *</label><input className="glass-input w-full" placeholder="e.g. Nitrogen, Argon, CO₂" value={gasForm.type} onChange={gf('type')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Capacity</label><input type="number" className="glass-input w-full" placeholder="500" value={gasForm.capacity} onChange={gf('capacity')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Current Level</label><input type="number" className="glass-input w-full" placeholder="350" value={gasForm.current} onChange={gf('current')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Unit</label>
              <select className="glass-input w-full" value={gasForm.unit} onChange={gf('unit')}><option>m³</option><option>kg</option><option>liters</option></select>
            </div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Refill Due</label><input type="date" className="glass-input w-full" value={gasForm.refillDate} onChange={gf('refillDate')} /></div>
          </div>
          <motion.button className="glass-btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveGas}>{editingGasId ? 'Update Tank' : 'Add Tank'}</motion.button>
        </div>
      </Modal>
    </div>
  );
}
