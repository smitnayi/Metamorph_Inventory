import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useAuth, useActivityFeed } from '../store/useStore';
import { useToast } from '../App';
import { api } from '../services/api';

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const emptyGasForm = { type: 'Argon', capacity: '', current_level: '', refill_date: '', cost: '' };

export default function UsageMetrics() {
  const [gasData, setGasData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gasForm, setGasForm] = useState(emptyGasForm);
  const [editingGasId, setEditingGasId] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { permissions, user } = useAuth();

  useEffect(() => {
    fetchGasRecords();
  }, []);

  const fetchGasRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gas-records/');
      setGasData(res);
    } catch (err) {
      addToast('Failed to load gas metrics from server', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const gf = (field) => (e) => setGasForm(prev => ({ ...prev, [field]: e.target.value }));

  const saveGas = async () => {
    if (!gasForm.capacity || !gasForm.current_level) { addToast('Capacity and Current Level are required', 'warning'); return; }
    
    setProcessing(true);
    try {
        const payload = {
            ...gasForm,
            capacity: Number(gasForm.capacity) || 0,
            current_level: Number(gasForm.current_level) || 0,
            cost: Number(gasForm.cost) || 0,
            refill_date: gasForm.refill_date || null
        };

        if (editingGasId) {
            await api.put(`/gas-records/${editingGasId}/`, payload);
            addToast('Gas record updated', 'success');
            logActivity(user.username, 'updated gas levels for', gasForm.type, 'info');
        } else {
            await api.post('/gas-records/', payload);
            addToast('Gas record added', 'success');
            logActivity(user.username, 'logged new gas refill for', gasForm.type, 'success');
        }
        
        setIsModalOpen(false);
        fetchGasRecords();
    } catch (err) {
        addToast('Failed to save gas metric', 'danger');
    } finally {
        setProcessing(false);
    }
  };

  const deleteGas = async (gas) => {
    if (window.confirm('Delete this gas record?')) {
        try {
            await api.delete(`/gas-records/${gas.id}/`);
            addToast('Record deleted', 'info');
            logActivity(user.username, 'deleted gas record for', gas.type, 'danger');
            fetchGasRecords();
        } catch (err) {
             addToast('Failed to delete gas metric', 'danger');
        }
    }
  };

  const trendData = [
    { name: 'Week 1', consumption: 400 },
    { name: 'Week 2', consumption: 300 },
    { name: 'Week 3', consumption: 550 },
    { name: 'Week 4', consumption: 480 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Utility & Environmental Metrics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track gas levels, consumption, and sustainability metrics</p>
        </div>
        {permissions.canCreate && (
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
            onClick={() => { setEditingGasId(null); setGasForm(emptyGasForm); setIsModalOpen(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/20 transition-colors flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4" /></svg>
            Log Refill/Tank
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 !p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Gas Cylinder Inventory</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {loading ? (
                 <div className="md:col-span-2 p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Synchronizing Gas records...</div>
              ) : gasData.length === 0 ? (
                 <div className="md:col-span-2 p-8 text-center text-sm border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--divider)', color: 'var(--text-muted)' }}>No tanks actively monitored.</div>
              ) : gasData.map(gas => {
                const pct = gas.capacity ? Math.round((gas.current_level / gas.capacity) * 100) : 0;
                const days = getDaysUntil(gas.refill_date);
                return (
                  <motion.div key={gas.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="relative p-5 rounded-xl border bg-black/5 dark:bg-white/5 transition-all outline outline-1 outline-transparent hover:outline-orange-500/30 group" 
                    style={{ borderColor: 'var(--divider)' }}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-1 bg-black/10 dark:bg-white/10 rounded text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-primary)' }}>{gas.type}</span>
                        <h4 className="text-xl font-bold mt-2 font-mono" style={{ color: 'var(--text-primary)' }}>{gas.current_level}<span className="text-sm font-sans font-normal text-gray-500 ml-1">/ {gas.capacity} L</span></h4>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {permissions.canEdit && (
                            <button onClick={() => { setEditingGasId(gas.id); setGasForm(gas); setIsModalOpen(true); }} className="p-1.5 bg-blue-500/10 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors" title="Edit"><svg w="14" h="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        )}
                        {permissions.canDelete && (
                            <button onClick={() => deleteGas(gas)} className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors" title="Delete"><svg w="14" h="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                        )}
                      </div>
                    </div>

                    <div className="h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className={`h-full rounded-full ${pct > 40 ? 'bg-emerald-500' : pct > 15 ? 'bg-orange-500' : 'bg-red-500'}`} />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{pct}% Remaining</span>
                      {days !== null && (
                        <span className={`font-medium ${days <= 3 ? 'text-red-500' : ''}`}>
                          {days < 0 ? 'Overdue' : days === 0 ? 'Refill Today' : `Refill in ${days}d`}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col h-full !p-5">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Consumption</h3>
          <div className="flex-1 w-full relative -left-4 min-h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                 <defs>
                   <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#E8771A" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#E8771A" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                 <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '8px' }} />
                 <Area type="monotone" dataKey="consumption" stroke="#E8771A" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingGasId ? "Edit Gas Record" : "Add New Gas Record"}>
        <div className="space-y-4">
           <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Gas/Chemical Type</label>
             <select value={gasForm.type} onChange={gf('type')} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}>
               <option value="Argon">Argon</option><option value="LPG">LPG / Propane</option><option value="Nitrogen">Nitrogen</option><option value="Oxygen">Oxygen</option>
             </select>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Capacity Total (L/kg)</label><input type="number" value={gasForm.capacity} onChange={gf('capacity')} className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}/></div>
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Current Level</label><input type="number" value={gasForm.current_level} onChange={gf('current_level')} className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}/></div>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Refill Due Date</label><input type="date" value={gasForm.refill_date} onChange={gf('refill_date')} className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}/></div>
             <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Cost ($)</label><input type="number" value={gasForm.cost} onChange={gf('cost')} className="w-full bg-transparent border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}/></div>
           </div>
           
           <button disabled={processing} onClick={saveGas} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg text-sm mt-4 transition-colors disabled:opacity-50">
             {processing ? 'Saving Database...' : 'Save Record'}
           </button>
        </div>
      </Modal>
    </div>
  );
}
