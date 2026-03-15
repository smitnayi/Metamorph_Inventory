import { useState } from 'react';
import { motion } from 'framer-motion';
import { powderUsageData, powderByTypeData, gasData, gasUsageOverTime } from '../data/mockData';
import GlassCard from '../components/GlassCard';
import { useToast } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(18,20,30,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-text-muted mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color || p.fill }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function UsageMetrics() {
  const [dateRange, setDateRange] = useState('30D');
  const addToast = useToast();

  const totalPowderUsed = powderByTypeData.reduce((s, p) => s + p.used, 0);
  const totalGasUsed = gasData.reduce((s, g) => s + g.consumedToday, 0);
  const avgDailyPowder = Math.round(totalPowderUsed / 30);

  const ranges = { '7D': 7, '30D': 30, '90D': 90 };
  const slicedPowder = powderUsageData.slice(-ranges[dateRange]);
  const slicedGas = gasUsageOverTime.slice(-ranges[dateRange]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Usage Metrics</h2>
          <p className="text-text-muted text-sm mt-1">Powder consumption and gas usage analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {['7D', '30D', '90D'].map(r => (
              <motion.button key={r} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${dateRange === r ? 'bg-amber/20 text-amber border border-amber/30' : 'text-text-muted hover:text-text-primary glass-btn'}`}
                whileTap={{ scale: 0.95 }} onClick={() => setDateRange(r)}>{r}</motion.button>
            ))}
          </div>
          <motion.button className="glass-btn text-sm flex items-center gap-2" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => addToast('Report download started', 'info')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </motion.button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Powder Used', value: `${totalPowderUsed.toLocaleString()} kg`, color: '#00D4FF' },
          { label: 'Avg Daily Consumption', value: `${avgDailyPowder} kg/day`, color: '#F5A623' },
          { label: 'Gas Used Today', value: `${totalGasUsed} m³`, color: '#22C55E' },
          { label: 'Powder Types Active', value: powderByTypeData.length, color: '#A78BFA' },
        ].map((t, i) => (
          <GlassCard key={t.label} delay={i * 0.05} className="!p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{t.label}</p>
            <p className="text-2xl font-mono font-bold mt-1" style={{ color: t.color }}>{t.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Powder consumption line chart */}
        <GlassCard hover={false} delay={0.1}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-1">Powder Consumption</h3>
          <p className="text-xs text-text-muted mb-4">Daily usage trend (kg)</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slicedPowder} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(slicedPowder.length / 7)} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="usage" stroke="#00D4FF" strokeWidth={2} dot={false} animationDuration={1500} name="Usage (kg)" />
                <Line type="monotone" dataKey="target" stroke="#F5A623" strokeWidth={1} strokeDasharray="5 5" dot={false} animationDuration={1500} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Gas usage stacked bar */}
        <GlassCard hover={false} delay={0.15}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-1">Gas Usage by Type</h3>
          <p className="text-xs text-text-muted mb-4">Daily breakdown (m³)</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slicedGas} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(slicedGas.length / 7)} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="nitrogen" stackId="gas" fill="#00D4FF" radius={[0, 0, 0, 0]} animationDuration={1500} name="Nitrogen" />
                <Bar dataKey="argon" stackId="gas" fill="#F5A623" radius={[0, 0, 0, 0]} animationDuration={1500} name="Argon" />
                <Bar dataKey="co2" stackId="gas" fill="#22C55E" radius={[4, 4, 0, 0]} animationDuration={1500} name="CO₂" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Bottom tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top powder consumers */}
        <GlassCard hover={false} delay={0.2}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Top Powder Consumers</h3>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Powder', 'Used (kg)', 'Jobs', 'Avg/Job'].map(h => <th key={h} className="text-left px-3 py-2 text-xs text-text-muted uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {powderByTypeData.map((p, i) => (
                <motion.tr key={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-sm text-text-primary">{p.name}</td>
                  <td className="px-3 py-2.5 text-sm font-mono text-cyan">{p.used.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-sm font-mono text-text-muted">{p.jobs}</td>
                  <td className="px-3 py-2.5 text-sm font-mono text-text-muted">{p.avgPerJob} kg</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        {/* Gas tank status */}
        <GlassCard hover={false} delay={0.25}>
          <h3 className="font-heading font-semibold text-base text-text-primary mb-4">Gas Tank Status</h3>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Gas Type', 'Capacity', 'Current', 'Used Today', 'Refill Due'].map(h => <th key={h} className="text-left px-3 py-2 text-xs text-text-muted uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {gasData.map((g, i) => {
                const pct = Math.round((g.current / g.capacity) * 100);
                const color = pct > 50 ? '#22C55E' : pct > 25 ? '#FACC15' : '#EF4444';
                return (
                  <motion.tr key={g.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 text-sm text-text-primary">{g.type}</td>
                    <td className="px-3 py-2.5 text-sm font-mono text-text-muted">{g.capacity} {g.unit}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
                        <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-sm font-mono text-text-muted">{g.consumedToday} {g.unit}</td>
                    <td className="px-3 py-2.5 text-sm text-text-muted">{g.refillDate}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
