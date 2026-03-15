import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';
import { kpiData, powderUsageData, activityFeed, gasData, qualityLogs } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

const sparkStockData = [42, 45, 48, 43, 50, 47, 52, 48, 55, 51, 48, 50];
const sparkTaskData = [8, 12, 10, 14, 11, 15, 13, 14];
const sparkQualityData = [95, 97, 96, 98, 97, 96, 98, 97, 97.4];
const sparkGasData = [400, 380, 350, 340, 330, 320, 312];

const gasDonutData = gasData.map((g) => ({
  name: g.type.split(' (')[0],
  value: g.consumedToday,
}));
const DONUT_COLORS = ['#00D4FF', '#F5A623', '#22C55E'];

const qualityIssues = qualityLogs
  .filter((q) => q.result === 'Fail')
  .map((q) => ({ name: q.powderType.split(' ').slice(1).join(' '), count: 1, batch: q.batchId }));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-3 py-2 text-xs" style={{
        background: 'rgba(18, 20, 30, 0.95)', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>
        <p className="text-text-muted mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-mono font-medium">{p.value} kg</p>
        ))}
      </div>
    );
  }
  return null;
};

function ActivityItem({ item, index }) {
  const typeColors = { success: '#22C55E', warning: '#FACC15', danger: '#EF4444', info: '#00D4FF' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: typeColors[item.type], boxShadow: `0 0 6px ${typeColors[item.type]}` }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">
          <span className="font-medium">{item.user}</span>
          <span className="text-text-muted"> {item.action} </span>
          <span className="text-amber font-medium">{item.target}</span>
        </p>
        <p className="text-xs text-text-muted mt-0.5">{item.time}</p>
      </div>
    </motion.div>
  );
}

function GasGauge({ gas }) {
  const pct = Math.round((gas.current / gas.capacity) * 100);
  const circumference = 2 * Math.PI * 42;
  const dashoffset = circumference - (pct / 100) * circumference;
  const color = pct > 50 ? '#22C55E' : pct > 25 ? '#FACC15' : '#EF4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-2 text-center">{gas.type.split(' (')[0]}</p>
      <p className="text-xs font-mono text-text-primary">{gas.current} / {gas.capacity} {gas.unit}</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Page title */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-text-primary">Dashboard</h2>
        <p className="text-text-muted text-sm mt-1">Overview of today's operations</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Powder Stock"
          value={kpiData.totalPowderStock}
          suffix=" kg"
          trend="+3.2% vs last week"
          trendUp={true}
          sparkData={sparkStockData}
          color="#00D4FF"
          delay={0}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <StatCard
          title="Tasks Completed"
          value={kpiData.tasksCompleted}
          suffix={` / ${kpiData.totalTasks}`}
          trend="64% completion rate"
          trendUp={true}
          sparkData={sparkTaskData}
          color="#F5A623"
          delay={0.1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <StatCard
          title="Quality Pass Rate"
          value={kpiData.qualityPassRate}
          suffix="%"
          trend="+0.8% this week"
          trendUp={true}
          sparkData={sparkQualityData}
          color="#22C55E"
          delay={0.2}
          decimals={1}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard
          title="Gas Remaining"
          value={kpiData.gasRemaining}
          suffix=" m³"
          trend="-5.1% today"
          trendUp={false}
          sparkData={sparkGasData}
          color="#EF4444"
          delay={0.3}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Powder Usage Chart — 2 cols */}
        <GlassCard className="xl:col-span-2" delay={0.15} hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-semibold text-base text-text-primary">Powder Usage</h3>
              <p className="text-xs text-text-muted mt-0.5">Last 30 days consumption (kg)</p>
            </div>
            <div className="flex gap-2">
              {['7D', '30D', '90D'].map((label) => (
                <button key={label} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${label === '30D' ? 'bg-amber/20 text-amber' : 'text-text-muted hover:text-text-primary hover:bg-white/5'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powderUsageData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="usage" stroke="#00D4FF" strokeWidth={2} fill="url(#colorUsage)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Activity Feed — 1 col */}
        <GlassCard delay={0.2} hover={false}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-3">Today's Activity</h3>
          <div className="overflow-y-auto max-h-[300px] pr-1">
            {activityFeed.map((item, i) => (
              <ActivityItem key={item.id} item={item} index={i} />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gas Usage Gauges */}
        <GlassCard delay={0.25} hover={false}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Gas Tank Levels</h3>
          <div className="flex items-center justify-around">
            {gasData.map((gas, i) => (
              <GasGauge key={i} gas={gas} />
            ))}
          </div>
        </GlassCard>

        {/* Top Quality Issues */}
        <GlassCard delay={0.3} hover={false}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Recent Quality Issues</h3>
          {qualityIssues.length > 0 ? (
            <div className="space-y-3">
              {qualityIssues.map((issue, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-danger" style={{ boxShadow: '0 0 6px #EF4444' }} />
                  <div className="flex-1">
                    <p className="text-sm text-text-primary font-medium">{issue.name}</p>
                    <p className="text-xs text-text-muted">Batch: {issue.batch}</p>
                  </div>
                  <span className="badge badge-danger text-[10px]">FAIL</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2 opacity-40">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className="text-sm">No quality issues today!</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
