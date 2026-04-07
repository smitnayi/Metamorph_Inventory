import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import Drawer from '../components/Drawer';
import { useAuth, useActivityFeed } from '../store/useStore';
import { useToast } from '../App';
import { api } from '../services/api';
import { Meteors } from '../components/ui/meteors';

function StatusBadge({ status }) {
  const c = status === 'In Stock' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 
            status === 'Low Stock' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 
            status === 'Critical' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
            'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${c}`}>{status}</span>;
}

const emptyForm = { name: '', sku: '', color: '#E8771A', current_stock: '', min_level: '20', location: '' };

export default function PowderStock() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { permissions, user } = useAuth();

  useEffect(() => {
    fetchPowders();
  }, []);

  const fetchPowders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/powders/');
      setData(res);
    } catch (err) {
      addToast('Failed to load powder stock from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSKUs = data.length;
  const lowStockCount = data.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
  const totalStock = data.reduce((sum, p) => sum + Number(p.current_stock || 0), 0);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setIsDrawerOpen(true); };
  
  const openEdit = (item) => {
    if (!permissions.canEdit) return;
    setEditingId(item.id); 
    setForm({ 
      name: item.name, sku: item.sku, color: item.color, 
      current_stock: item.current_stock, min_level: item.min_level, location: item.location 
    }); 
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) { addToast('Name and SKU are required.', 'warning'); return; }
    
    setProcessing(true);
    try {
        const payload = {
            ...form,
            current_stock: Number(form.current_stock) || 0,
            min_level: Number(form.min_level) || 0
        };

        if (editingId) {
            await api.put(`/powders/${editingId}/`, payload);
            addToast('Stock entry updated!', 'success');
            logActivity(user.username, 'updated stock for', form.name, 'info');
        } else {
            await api.post('/powders/', payload);
            addToast('New powder added successfully!', 'success');
            logActivity(user.username, 'added new powder', form.name, 'success');
        }
        
        setIsDrawerOpen(false);
        fetchPowders(); // Refresh from DB
    } catch (err) {
        addToast(err.message || 'Failed to save powder', 'danger');
    } finally {
        setProcessing(false);
    }
  };

  const deleteEntry = async (id, name) => {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
        try {
            await api.delete(`/powders/${id}/`);
            addToast('Stock entry deleted.', 'info');
            logActivity(user.username, 'deleted stock entry', name, 'danger');
            fetchPowders();
        } catch (err) {
            addToast('Error deleting powder', 'danger');
        }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Powder Stock</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage inventory levels across pipelines</p>
        </div>
        {permissions.canCreate && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Add New Powder
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="!p-5">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Stock Level</p>
          <div className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{totalStock} <span className="text-lg text-gray-500">kg</span></div>
        </GlassCard>
        <GlassCard className="!p-5 border-l-4 relative overflow-hidden group" style={{ borderLeftColor: lowStockCount > 2 ? '#EF4444' : '#F59E0B' }}>
          <div className="relative z-10">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Low Stock Alerts</p>
            <div className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{lowStockCount} <span className="text-lg text-gray-500">items</span></div>
          </div>
          {lowStockCount > 0 && <Meteors number={10} className="opacity-50" />}
        </GlassCard>
        <GlassCard className="!p-5">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Registered SKUs</p>
          <div className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{totalSKUs}</div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden !p-0">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center" style={{ borderColor: 'var(--divider)', background: 'var(--surface-hover)' }}>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search SKU or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-orange-500 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors"
              style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'In Stock', 'Low Stock', 'Critical'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${statusFilter === f ? 'bg-orange-500 text-white' : 'glass-btn border border-transparent hover:border-orange-500/30'}`}
                style={statusFilter !== f ? { color: 'var(--text-muted)' } : {}}>{f}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Testing Backend Connection... Fetching live data...</div>
          ) : data.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--divider)' }}>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Color</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>SKU</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Location</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Stock</th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                     <tr><td colSpan={7} className="px-5 py-8 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>No powders match this filter.</td></tr>
                  ) : (
                    filtered.map((item, i) => (
                      <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`group ${permissions.canEdit ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
                        style={{ borderBottom: '1px solid var(--divider)' }}
                        onClick={() => openEdit(item)}>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <div className="w-8 h-8 rounded-full border shadow-inner" style={{ backgroundColor: item.color, borderColor: 'var(--glass-border)' }} title={item.color} />
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{item.sku}</td>
                        <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                        <td className="px-5 py-3 hidden md:table-cell text-sm" style={{ color: 'var(--text-muted)' }}>{item.location || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.current_stock}</span> <span className="text-xs text-gray-500">kg</span>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-5 py-3 text-right">
                          {permissions.canDelete && (
                            <button onClick={(e) => { e.stopPropagation(); deleteEntry(item.id, item.name); }}
                              className="p-2 bg-red-500/10 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                              <svg w="14" h="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No powder stock in database. Add one to get started!
            </div>
          )}
        </div>
      </GlassCard>

      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={editingId ? 'Edit Powder Stock' : 'Add New Powder'}>
        <div className="space-y-4">
          <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SKU Code</label><input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="e.g. RAL-9005" /></div>
          <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Powder Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="e.g. Matte Black" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Visual Color</label>
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border rounded-lg px-2 pr-3 py-1.5" style={{ borderColor: 'var(--divider)' }}>
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent" />
                <span className="text-xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>{form.color}</span>
              </div>
            </div>
            <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Location</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="e.g. WH-A-12" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Stock (kg)</label><input type="number" min="0" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} /></div>
             <div><label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Min Level (Alert)</label><input type="number" min="0" value={form.min_level} onChange={e => setForm({ ...form, min_level: e.target.value })} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} /></div>
          </div>
          <button disabled={processing} onClick={handleSave} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg text-sm mt-4 transition-colors disabled:opacity-50">
            {processing ? 'Saving to Database...' : 'Save Powder Record'}
          </button>
        </div>
      </Drawer>
    </div>
  );
}
