import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePersistedState, useActivityFeed } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Drawer from '../components/Drawer';
import { useToast } from '../App';

function StatusBadge({ status }) {
  const styles = { 'In Stock': 'badge-success', 'Low Stock': 'badge-warning', 'Out of Stock': 'badge-danger', Critical: 'badge-danger' };
  return <span className={`badge ${styles[status] || 'badge-cyan'}`}>{status}</span>;
}

const emptyForm = { name: '', sku: '', color: '#F5A623', stock: '', location: '', batchDate: '', status: 'In Stock' };

export default function PowderStock() {
  const [stock, setStock] = usePersistedState('powderStock', []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();

  const filtered = stock.filter((item) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(search.toLowerCase()) || (item.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSKUs = stock.length;
  const lowStockCount = stock.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
  const totalStock = stock.reduce((sum, p) => sum + Number(p.stock || 0), 0);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setDrawerOpen(true); };
  const openEdit = (item) => { setEditingId(item.id); setForm({ name: item.name, sku: item.sku, color: item.color, stock: item.stock, location: item.location, batchDate: item.batchDate, status: item.status }); setDrawerOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim()) { addToast('Name and SKU are required.', 'warning'); return; }
    if (editingId !== null) {
      setStock(prev => prev.map(s => s.id === editingId ? { ...s, ...form, stock: Number(form.stock) || 0, lastUpdated: 'Just now' } : s));
      addToast('Stock entry updated!', 'success');
      logActivity('You', 'updated stock for', form.name, 'info');
    } else {
      const newItem = { id: Date.now(), ...form, stock: Number(form.stock) || 0, lastUpdated: 'Just now' };
      setStock(prev => [newItem, ...prev]);
      addToast('New stock entry added!', 'success');
      logActivity('You', 'added new powder stock', form.name, 'success');
    }
    setDrawerOpen(false);
  };

  const handleDelete = (item) => {
    setStock(prev => prev.filter(s => s.id !== item.id));
    addToast('Stock entry deleted.', 'info');
    logActivity('You', 'deleted stock entry', item.name, 'danger');
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Powder Stock</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage powder inventory and stock levels</p>
        </div>
        <div className="flex gap-3">
          <motion.button className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => addToast('CSV export started', 'info')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </motion.button>
          <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openAdd}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Stock
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard delay={0} className="!p-4"><p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Total SKUs</p><p className="text-2xl font-mono font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{totalSKUs}</p></GlassCard>
        <GlassCard delay={0.05} className="!p-4"><p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Low / Critical</p><p className="text-2xl font-mono font-bold text-warning mt-1">{lowStockCount}</p></GlassCard>
        <GlassCard delay={0.1} className="!p-4"><p className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Total Stock</p><p className="text-2xl font-mono font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{totalStock.toLocaleString()} kg</p></GlassCard>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input type="text" placeholder="Search powder name or SKU…" className="glass-input flex-1 min-w-[200px]" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {['All', 'In Stock', 'Low Stock', 'Critical', 'Out of Stock'].map(s => (
            <motion.button key={s} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-amber/20 text-amber border border-amber/30' : 'glass-btn'}`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStatusFilter(s)}>{s}</motion.button>
          ))}
        </div>
      </div>

      <GlassCard hover={false} delay={0.1} className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Color', 'Powder Name', 'SKU', 'Stock (kg)', 'Location', 'Batch Date', 'Status', 'Updated', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.025 }} className="cursor-pointer" style={{ borderBottom: '1px solid var(--divider)' }}
                    onClick={() => openEdit(item)} whileHover={{ backgroundColor: 'var(--surface-hover)' }}>
                    <td className="px-5 py-3"><div className="w-6 h-6 rounded-md" style={{ background: item.color, border: '1px solid var(--glass-border)' }} /></td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{item.sku}</td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{Number(item.stock).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{item.location}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{item.batchDate}</td>
                    <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{item.lastUpdated}</td>
                    <td className="px-5 py-3">
                      <motion.button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} whileTap={{ scale: 0.9 }}
                        onClick={e => { e.stopPropagation(); handleDelete(item); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <p className="text-sm">{stock.length === 0 ? 'No powder stock yet — add your first entry!' : 'No items match your filters.'}</p>
          </div>
        )}
      </GlassCard>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId !== null ? 'Edit Stock Entry' : 'Add New Stock'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Powder Name *</label>
            <input type="text" className="glass-input w-full" placeholder="e.g. RAL 9010 Pure White" value={form.name} onChange={f('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>SKU *</label><input type="text" className="glass-input w-full" placeholder="e.g. PW-9010" value={form.sku} onChange={f('sku')} /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Color</label>
              <div className="flex gap-2 items-center"><input type="color" className="glass-input w-12 h-10 p-1 cursor-pointer" value={form.color} onChange={f('color')} /><input type="text" className="glass-input flex-1" value={form.color} onChange={f('color')} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Quantity (kg)</label><input type="number" className="glass-input w-full" placeholder="0" value={form.stock} onChange={f('stock')} min="0" /></div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Location / Bin</label><input type="text" className="glass-input w-full" placeholder="e.g. Bin A1" value={form.location} onChange={f('location')} /></div>
          </div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Batch Date</label><input type="date" className="glass-input w-full" value={form.batchDate} onChange={f('batchDate')} /></div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select className="glass-input w-full" value={form.status} onChange={f('status')}><option>In Stock</option><option>Low Stock</option><option>Critical</option><option>Out of Stock</option></select>
          </div>
          <div className="pt-4 flex gap-3">
            <motion.button className="glass-btn-primary flex-1 py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave}>{editingId !== null ? 'Update Entry' : 'Add Entry'}</motion.button>
            <motion.button className="glass-btn flex-1 py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setDrawerOpen(false)}>Cancel</motion.button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
