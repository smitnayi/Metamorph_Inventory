import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import { useActivityFeed } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { api } from '../services/api';

// Aceternity UI Components
import { HoverEffect } from '../components/ui/card-hover-effect';
import { BackgroundGradient } from '../components/ui/background-gradient';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{
      background: 'var(--modal-bg)', border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    }}>
      <p style={{ color: 'var(--text-muted)' }} className="mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-medium">{p.value} kg</p>
      ))}
    </div>
  );
};

function ActivityItem({ item, index }) {
  const typeColors = { success: '#22C55E', warning: '#FACC15', danger: '#EF4444', info: '#00D4FF' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid var(--divider)' }}
    >
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColors[item.type], boxShadow: `0 0 6px ${typeColors[item.type]}` }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          <span className="font-medium">{item.user}</span>
          <span style={{ color: 'var(--text-muted)' }}> {item.action} </span>
          <span className="text-orange-500 font-medium">{item.target}</span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.time}</p>
      </div>
    </motion.div>
  );
}

function GasGauge({ 
  capacity = 1, currentLevel = 0, type = 'Metric', color = '#22C55E' 
}) {
  const pct = capacity > 0 ? Math.round((currentLevel / capacity) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const dashoffset = circumference - (pct / 100) * circumference;
  const activeColor = pct > 50 ? color : pct > 25 ? '#FACC15' : '#EF4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
        <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
          <circle cx="48" cy="48" r="42" fill="none" strokeWidth="12" style={{ stroke: 'var(--divider)' }} />
          <circle cx="48" cy="48" r="42" fill="none" strokeWidth="12" strokeLinecap="round"
            style={{ stroke: activeColor, strokeDasharray: circumference, strokeDashoffset: dashoffset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none mt-1">
          <span className="text-xl font-bold font-mono drop-shadow-md" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: 'var(--text-muted)' }}>{type}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
      totalStock: 0, totalSKUs: 0, 
      totalTasks: 0, tasksDone: 0,
      passRate: 0, totalInspections: 0,
      totalGas: 0, totalTanks: 0
  });
  const [loading, setLoading] = useState(true);
  const { feed } = useActivityFeed();

  useEffect(() => {
     const fetchSummary = async () => {
         try {
             const data = await api.get('/dashboard-summary/');
             setStats(data);
         } catch (err) {
             console.error("Failed to load dashboard KPIs");
         } finally {
             setLoading(false);
         }
     };
     fetchSummary();
  }, []);

  const chartData = [
    { name: 'Mon', stock: Math.max(0, stats.totalStock - 50), threshold: 100 },
    { name: 'Tue', stock: Math.max(0, stats.totalStock - 20), threshold: 100 },
    { name: 'Wed', stock: Math.max(0, stats.totalStock - 10), threshold: 100 },
    { name: 'Thu', stock: Math.max(0, stats.totalStock + 10), threshold: 100 },
    { name: 'Fri', stock: Math.max(0, stats.totalStock), threshold: 100 }
  ];

  const kpiItems = [
    {
      id: 1,
      title: "Total Powder Inventory",
      value: `${stats.totalStock}`,
      trend: `${stats.totalSKUs} active SKUs`,
      trendUp: true,
      icon: <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    },
    {
      id: 2,
      title: "Active Production Tasks",
      value: `${stats.totalTasks}`,
      trend: `${stats.tasksDone} completed tasks`,
      trendUp: true,
      icon: <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      id: 3,
      title: "QC Pass Rate",
      value: `${stats.passRate}%`,
      trend: `${stats.totalInspections} logs today`,
      trendUp: stats.passRate > 90,
      icon: <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    },
    {
      id: 4,
      title: "Tanks Monitored",
      value: `${stats.totalTanks}`,
      trend: `${stats.totalGas}L capacity tracked`,
      trendUp: false,
      icon: <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Command Center</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time overview of facility operations</p>
      </div>

      {loading ? (
          <div className="p-12 text-center text-sm animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading live facility data...</div>
      ) : (
      <>
      
      {/* ── Aceternity HoverEffect Grid ── */}
      <HoverEffect items={kpiItems} className="!py-0">
        {(item, idx) => (
          <GlassCard className="relative z-10 w-full h-full !p-5 bg-black/40 backdrop-blur-3xl border border-white/10 group-hover:border-white/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(234,88,12,0.1)]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">{item.icon}</div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-black/20 ${item.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                 {item.trendUp ? '↑' : '↓'} {item.trend}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{item.title}</p>
              <h3 className="text-3xl font-bold font-mono tracking-tight text-white/90">{item.value}</h3>
            </div>
          </GlassCard>
        )}
      </HoverEffect>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <GlassCard className="lg:col-span-2 flex flex-col h-[400px] border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>Inventory Depletion Trend</h3>
          </div>
          <div className="flex-1 w-full relative -left-4">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                 <defs>
                   <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#E8771A" stopOpacity={0.5}/>
                     <stop offset="95%" stopColor="#E8771A" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={value => `${value}`} />
                 <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                 <Area type="monotone" dataKey="stock" stroke="#E8771A" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" activeDot={{ r: 6, fill: '#E8771A', stroke: '#1a1d2b', strokeWidth: 3 }} />
               </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* ── Aceternity BackgroundGradient ── */}
        <BackgroundGradient className="h-full rounded-[22px] p-4 sm:p-6 bg-[#0D0F14] sm:h-[400px]">
          <h3 className="font-bold flex items-center justify-between tracking-wide text-white mb-6">
            System Health
          </h3>
          <div className="flex-1 flex flex-col justify-around py-4">
            <div className="flex justify-around items-center h-full gap-4">
               <GasGauge capacity={100} currentLevel={stats.passRate} type="Quality" color="#10B981" />
               <GasGauge capacity={100} currentLevel={stats.totalTasks > 0 ? (stats.tasksDone/stats.totalTasks) * 100 : 100} type="Execution" color="#00D4FF" />
            </div>
            <div className="mt-8">
               <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-sm font-semibold text-emerald-400 tracking-wide">API Synced (Latency: &lt;15ms)</span>
               </div>
            </div>
          </div>
        </BackgroundGradient>
      </div>

      <GlassCard className="border border-white/5 mt-4">
        <h3 className="font-bold tracking-wide mb-4" style={{ color: 'var(--text-primary)' }}>Live Activity Feed</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {feed.length === 0 ? (
            <p className="text-sm italic py-4 text-center opacity-50 text-white">No recent activity to show.</p>
          ) : (
            feed.slice(0, 10).map((item, i) => <ActivityItem key={item.id} item={item} index={i} />)
          )}
        </div>
      </GlassCard>
      </>
      )}
    </div>
  );
}
