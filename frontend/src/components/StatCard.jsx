import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, duration = 1500, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setDisplay(current);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.floor(display).toLocaleString();

  return <span>{prefix}{formatted}{suffix}</span>;
}

function MiniSparkline({ data, color = '#00D4FF', height = 30, width = 80 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StatCard({ title, value, prefix = '', suffix = '', trend, trendUp, sparkData, color = '#00D4FF', delay = 0, decimals = 0, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, borderColor: `${color}33`, boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${color}15` }}
      className="glass-card p-5 flex flex-col justify-between min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-3 font-body">{title}</p>
          <p className="text-3xl font-mono font-bold text-text-primary">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: trendUp ? 'rotate(0deg)' : 'rotate(180deg)' }}>
              <polyline points="18 15 12 9 6 15" />
            </svg>
            {trend}
          </div>
        )}
        {sparkData && <MiniSparkline data={sparkData} color={color} />}
      </div>
    </motion.div>
  );
}
