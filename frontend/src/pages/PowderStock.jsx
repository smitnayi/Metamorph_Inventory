import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import Drawer from '../components/Drawer';
import { usePersistedState, useActivityFeed, useAuth } from '../store/useStore';
import { useToast } from '../App';

function StatusBadge({ status }) {
  const c = status === 'In Stock' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : status === 'Low Stock' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : status === 'Critical' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${c}`}>{status}</span>;
}

const emptyForm = { name: '', sku: '', color: '#E8771A', stock: '', location: '', batchDate: '', status: 'In Stock' };

export default function PowderStock() {
  const [data, setData] = usePersistedState('powderStock', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { isAdmin } = useAuth();

  const filtered = data.filter((item) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSKUs = data.length;
  const lowStockCount = data.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
  const totalStock = data.reduce((sum, p) => sum + Number(p.stock || 0), 0);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setIsDrawerOpen(true); };
  const openEdit = (item) => { setEditingId(item.id); setForm({ name: item.name, sku: item.sku, color: item.color, stock: item.stock, location: item.location, batchDate: item.batchDate, status: item.status }); setIsDrawerOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim()) { addToast('Name and SKU are required.', 'warning'); return; }
    if (editingId) {
      setData(prev => prev.map(s => s.id === editingId ? { ...s, ...form, stock: Number(form.stock) || 0, lastUpdated: 'Just now' } : s));
      addToast('Stock entry updated!', 'success');
      logActivity('You', 'updated stock for', form.name, 'info');
    } else {
      const newItem = { id: `PW${Date.now()}`, ...form, stock: Number(form.stock) || 0, lastUpdated: 'Just now' };
      setData(prev => [newItem, ...prev]);
      addToast('New stock entry added!', 'success');
      logActivity('You', 'added new powder stock', form.name, 'success');
    }
    setIsDrawerOpen(false);
  };

  const deleteEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this powder stock?')) {
      const itemToDelete = data.find(s => s.id === id);
      setData(prev => prev.filter(s => s.id !== id));
      addToast('Stock entry deleted.', 'info');
      logActivity('You', 'deleted stock entry', itemToDelete?.name || 'unknown', 'danger');
    }
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Powder Stock Manager</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track powder levels, locations, and low stock warnings.</p>
        </div>
        <motion.button className="glass-btn-primary text-sm shadow-xl" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Powder
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard delay={0.1} className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
            <div><p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total SKUs</p><h3 className="text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{totalSKUs}</h3></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.2} className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></div>
            <div><p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Total Stock (kg)</p><h3 className="text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{totalStock}</h3></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.3} className="!p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
            <div><p className="text-xs uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Low Stock Alerts</p><h3 className="text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{lowStockCount}</h3></div>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" placeholder="Search powder name or SKU…" className="glass-input flex-1 min-w-[200px]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'].map(s => (
            <motion.button key={s} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'glass-btn'}`}
              onClick={() => setStatusFilter(s)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{s}</motion.button>
          ))}
        </div>
      </div>

      <GlassCard className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--divider)' }}>
                {['Color', 'Name', 'SKU', 'Stock (kg)', 'Location', 'Status', 'Updated', ''].map((h, i) => (
                  <th key={i} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                    {data.length === 0 ? "No powder stock added yet. Click 'Add Powder'." : "No matching stock found."}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((item, i) => (
                    <motion.tr key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.05 }}
                      className="cursor-pointer group" style={{ borderBottom: '1px solid var(--divider)' }} onClick={() => openEdit(item)}
                      whileHover={{ backgroundColor: 'var(--surface-hover)' }}>
                      <td className="px-5 py-3"><div className="w-6 h-6 rounded-md shadow-inner border" style={{ backgroundColor: item.color, borderColor: 'rgba(255,255,255,0.1)' }} title={item.color} /></td>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                      <td className="px-5 py-3 text-sm font-mono" style={{ color: '#00D4FF' }}>{item.sku}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{item.stock}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{item.location}</td>
                      <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{item.lastUpdated}</td>
                      <td className="px-5 py-3 text-right">
                        {isAdmin && (
                          <motion.button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} whileTap={{ scale: 0.9 }}
                            onClick={e => { e.stopPropagation(); deleteEntry(item.id); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'Edit Powder stock' : 'Add Powder Stock'}>
        <div className="space-y-5 p-2">
          <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Powder Name *</label><input type="text" className="glass-input w-full" value={form.name} onChange={f('name')} placeholder="e.g. Matte Black" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>SKU / ID *</label><input type="text" className="glass-input w-full font-mono text-sm" value={form.sku} onChange={f('sku')} placeholder="MB-101" /></div>
            <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Color Hex</label>
              <div className="flex gap-2">
                <input type="color" className="h-10 w-10 p-1 rounded-lg bg-transparent border border-gray-600/30 cursor-pointer" value={form.color} onChange={f('color')} />
                <input type="text" className="glass-input flex-1 font-mono text-sm uppercase" value={form.color} onChange={f('color')} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Stock (kg) *</label><input type="number" className="glass-input w-full" value={form.stock} onChange={f('stock')} placeholder="0" /></div>
            <div>
              <label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
              <select className="glass-input w-full" value={form.status} onChange={f('status')}>
                {['In Stock', 'Low Stock', 'Critical', 'Out of Stock'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Location</label><input type="text" className="glass-input w-full" value={form.location} onChange={f('location')} placeholder="e.g. Rack A1" /></div>
            <div><label className="text-xs font-semibold uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Batch Date</label><input type="date" className="glass-input w-full text-sm" value={form.batchDate} onChange={f('batchDate')} /></div>
          </div>
          <div className="pt-6 border-t mt-8 flex gap-3" style={{ borderColor: 'var(--divider)' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-btn flex-1 py-3" onClick={() => setIsDrawerOpen(false)}>Cancel</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="glass-btn-primary flex-1 py-3 justify-center" onClick={handleSave}>{editingId ? 'Save Changes' : 'Add to Stock'}</motion.button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
