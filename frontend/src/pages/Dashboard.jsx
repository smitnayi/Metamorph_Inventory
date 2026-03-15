import { useMemo } from 'react';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import { usePersistedState, useActivityFeed } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

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
          <span className="text-amber font-medium">{item.target}</span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.time}</p>
      </div>
    </motion.div>
  );
}

function GasGauge({ gas }) {
  const pct = gas.capacity > 0 ? Math.round((gas.current / gas.capacity) * 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const dashoffset = circumference - (pct / 100) * circumference;
  const color = pct > 50 ? '#22C55E' : pct > 25 ? '#FACC15' : '#EF4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r="42" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
          <motion.circle cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>{gas.type}</p>
      <p className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{gas.current} / {gas.capacity} {gas.unit}</p>
    </div>
  );
}

function EmptyState({ icon, message, sub }) {
  return (
    <div className="empty-state">
      {icon}
      <p className="text-sm font-medium">{message}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [powderStock] = usePersistedState('powderStock', []);
  const [tasks] = usePersistedState('tasks', []);
  const [qualityLogs] = usePersistedState('qualityLogs', []);
  const [gasData] = usePersistedState('gasData', []);
  const { feed } = useActivityFeed();

  const kpi = useMemo(() => {
    const totalStock = powderStock.reduce((s, p) => s + Number(p.stock || 0), 0);
    const tasksDone = tasks.filter(t => t.status === 'done').length;
    const passCount = qualityLogs.filter(q => q.result === 'Pass').length;
    const passRate = qualityLogs.length > 0 ? ((passCount / qualityLogs.length) * 100) : 0;
    const totalGas = gasData.reduce((s, g) => s + Number(g.current || 0), 0);
    return { totalStock, tasksDone, totalTasks: tasks.length, passRate, totalGas };
  }, [powderStock, tasks, qualityLogs, gasData]);

  const qualityIssues = qualityLogs.filter(q => q.result === 'Fail').slice(0, 5);

  // Build simple usage chart from powder stock (last entries as a pseudo-timeline)
  const usageChart = powderStock.slice(-20).map((p, i) => ({
    date: p.name?.split(' ').pop() || `#${i + 1}`,
    usage: Number(p.stock || 0),
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Overview of today's operations</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Powder Stock" value={kpi.totalStock} suffix=" kg" trend={`${powderStock.length} SKUs`}
          trendUp={true} color="#00D4FF" delay={0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <StatCard title="Tasks Completed" value={kpi.tasksDone} suffix={` / ${kpi.totalTasks}`}
          trend={kpi.totalTasks > 0 ? `${Math.round((kpi.tasksDone / kpi.totalTasks) * 100)}% done` : 'No tasks yet'}
          trendUp={true} color="#E8771A" delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <StatCard title="Quality Pass Rate" value={kpi.passRate} suffix="%" decimals={1}
          trend={`${qualityLogs.length} inspections`} trendUp={kpi.passRate >= 90} color="#22C55E" delay={0.2}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard title="Gas Remaining" value={kpi.totalGas} suffix=" m³"
          trend={`${gasData.length} tanks`} trendUp={false} color="#EF4444" delay={0.3}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart — 2 cols */}
        <GlassCard className="xl:col-span-2" delay={0.15} hover={false}>
          <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Powder Stock Levels</h3>
          {usageChart.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageChart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="usage" stroke="#00D4FF" strokeWidth={2} fill="url(#colorUsage)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              message="No powder stock data yet"
              sub="Add stock entries in Powder Stock page"
            />
          )}
        </GlassCard>

        {/* Activity Feed — 1 col */}
        <GlassCard delay={0.2} hover={false}>
          <h3 className="font-heading font-semibold text-base mb-3" style={{ color: 'var(--text-primary)' }}>Recent Activity</h3>
          <div className="overflow-y-auto max-h-[300px] pr-1">
            {feed.length > 0 ? (
              feed.slice(0, 15).map((item, i) => <ActivityItem key={item.id} item={item} index={i} />)
            ) : (
              <EmptyState
                icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                message="No activity yet"
                sub="Actions will appear here automatically"
              />
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gas Gauges */}
        <GlassCard delay={0.25} hover={false}>
          <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Gas Tank Levels</h3>
          {gasData.length > 0 ? (
            <div className="flex items-center justify-around flex-wrap gap-4">
              {gasData.map((gas, i) => <GasGauge key={i} gas={gas} />)}
            </div>
          ) : (
            <EmptyState
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}
              message="No gas tanks configured"
              sub="Add gas data in Usage Metrics page"
            />
          )}
        </GlassCard>

        {/* Quality Issues */}
        <GlassCard delay={0.3} hover={false}>
          <h3 className="font-heading font-semibold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Recent Quality Issues</h3>
          {qualityIssues.length > 0 ? (
            <div className="space-y-3">
              {qualityIssues.map((issue, i) => (
                <motion.div key={issue.id || i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{issue.powderType}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Batch: {issue.batchId}</p>
                  </div>
                  <span className="badge badge-danger text-[10px]">FAIL</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              message="No quality issues!"
              sub="All inspections passed or none logged yet"
            />
          )}
        </GlassCard>
      </div>
    </div>
  );
}
