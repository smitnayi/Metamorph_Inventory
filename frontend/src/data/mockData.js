// ── POWDER STOCK DATA ──
export const powderStockData = [
  { id: 1, name: 'RAL 9010 Pure White', sku: 'PW-9010', color: '#F5F5F0', stock: 850, location: 'Bin A1', batchDate: '2026-03-01', status: 'In Stock', lastUpdated: '2 hrs ago' },
  { id: 2, name: 'RAL 9005 Jet Black', sku: 'PB-9005', color: '#0A0A0A', stock: 620, location: 'Bin A2', batchDate: '2026-02-28', status: 'In Stock', lastUpdated: '4 hrs ago' },
  { id: 3, name: 'RAL 3020 Traffic Red', sku: 'PR-3020', color: '#CC0605', stock: 180, location: 'Bin B1', batchDate: '2026-02-25', status: 'Low Stock', lastUpdated: '1 day ago' },
  { id: 4, name: 'RAL 5015 Sky Blue', sku: 'PB-5015', color: '#2271B3', stock: 430, location: 'Bin B3', batchDate: '2026-03-05', status: 'In Stock', lastUpdated: '6 hrs ago' },
  { id: 5, name: 'RAL 6018 Yellow Green', sku: 'PG-6018', color: '#57A639', stock: 75, location: 'Bin C1', batchDate: '2026-02-20', status: 'Low Stock', lastUpdated: '3 days ago' },
  { id: 6, name: 'RAL 1021 Rapeseed Yellow', sku: 'PY-1021', color: '#F3A505', stock: 0, location: 'Bin C2', batchDate: '2026-01-15', status: 'Out of Stock', lastUpdated: '2 weeks ago' },
  { id: 7, name: 'RAL 7035 Light Grey', sku: 'PG-7035', color: '#D7D7D7', stock: 920, location: 'Bin A3', batchDate: '2026-03-10', status: 'In Stock', lastUpdated: '1 hr ago' },
  { id: 8, name: 'RAL 2004 Pure Orange', sku: 'PO-2004', color: '#E75B12', stock: 310, location: 'Bin D1', batchDate: '2026-03-08', status: 'In Stock', lastUpdated: '12 hrs ago' },
  { id: 9, name: 'RAL 8017 Chocolate Brown', sku: 'PB-8017', color: '#45322E', stock: 45, location: 'Bin D2', batchDate: '2026-02-10', status: 'Critical', lastUpdated: '5 days ago' },
  { id: 10, name: 'RAL 7016 Anthracite Grey', sku: 'PG-7016', color: '#293133', stock: 550, location: 'Bin A4', batchDate: '2026-03-12', status: 'In Stock', lastUpdated: '3 hrs ago' },
  { id: 11, name: 'RAL 4006 Traffic Purple', sku: 'PP-4006', color: '#A03472', stock: 120, location: 'Bin E1', batchDate: '2026-02-22', status: 'Low Stock', lastUpdated: '2 days ago' },
  { id: 12, name: 'RAL 1015 Light Ivory', sku: 'PI-1015', color: '#E6D2B5', stock: 680, location: 'Bin B2', batchDate: '2026-03-07', status: 'In Stock', lastUpdated: '8 hrs ago' },
];

// ── DAILY TASKS DATA ──
export const tasksData = [
  { id: 't1', title: 'Prep batch RAL 9010 for Line 2', description: 'Prepare 200kg of Pure White powder for morning production run on coating line 2.', assignee: 'Raj Mehta', avatar: 'RM', priority: 'High', dueTime: '09:00 AM', tag: 'Production', status: 'todo' },
  { id: 't2', title: 'QC check — Batch #B2026-0312', description: 'Perform thickness and adhesion tests on completed batch from yesterday.', assignee: 'Priya Shah', avatar: 'PS', priority: 'High', dueTime: '10:00 AM', tag: 'Quality', status: 'todo' },
  { id: 't3', title: 'Refill nitrogen tank', description: 'Contact gas supplier for scheduled nitrogen tank refill. Current level at 22%.', assignee: 'Amit Kumar', avatar: 'AK', priority: 'Medium', dueTime: '11:00 AM', tag: 'Maintenance', status: 'inprogress' },
  { id: 't4', title: 'Clean spray booth #3', description: 'Deep clean and maintenance of spray booth 3 before color changeover.', assignee: 'Vikram Singh', avatar: 'VS', priority: 'Medium', dueTime: '02:00 PM', tag: 'Maintenance', status: 'inprogress' },
  { id: 't5', title: 'Update inventory for RAL 3020', description: 'Log new shipment of Traffic Red powder received this morning. Update bin locations.', assignee: 'Sneha Patel', avatar: 'SP', priority: 'Low', dueTime: '03:00 PM', tag: 'Inventory', status: 'done' },
  { id: 't6', title: 'Calibrate oven temperature sensors', description: 'Monthly calibration of all 4 curing oven temperature sensors.', assignee: 'Raj Mehta', avatar: 'RM', priority: 'High', dueTime: '08:30 AM', tag: 'Maintenance', status: 'done' },
  { id: 't7', title: 'Package completed job #J-4521', description: 'Package and label finished coated parts for client pickup tomorrow.', assignee: 'Priya Shah', avatar: 'PS', priority: 'Medium', dueTime: '04:00 PM', tag: 'Production', status: 'done' },
  { id: 't8', title: 'Safety equipment inspection', description: 'Weekly inspection of PPE, fire extinguishers, and ventilation systems.', assignee: 'Amit Kumar', avatar: 'AK', priority: 'Low', dueTime: '05:00 PM', tag: 'Safety', status: 'todo' },
  { id: 't9', title: 'Mix custom RAL 7048 blend', description: 'Prepare custom pearl mouse grey blend for special order #SO-889.', assignee: 'Vikram Singh', avatar: 'VS', priority: 'High', dueTime: '01:00 PM', tag: 'Production', status: 'inprogress' },
  { id: 't10', title: 'Client review — Tata Motors parts', description: 'Present quality report and coated sample to Tata Motors QA team.', assignee: 'Sneha Patel', avatar: 'SP', priority: 'High', dueTime: '11:30 AM', tag: 'Quality', status: 'todo' },
];

// ── QUALITY LOGS ──
export const qualityLogs = [
  { id: 'QC-001', batchId: 'B2026-0312', powderType: 'RAL 9010 Pure White', inspector: 'Priya Shah', date: '2026-03-14', result: 'Pass', thickness: '72μm', adhesion: '5B', visual: 'OK', notes: 'Excellent finish, uniform coverage.' },
  { id: 'QC-002', batchId: 'B2026-0311', powderType: 'RAL 9005 Jet Black', inspector: 'Raj Mehta', date: '2026-03-14', result: 'Pass', thickness: '68μm', adhesion: '5B', visual: 'OK', notes: 'Glossy finish as per spec.' },
  { id: 'QC-003', batchId: 'B2026-0310', powderType: 'RAL 3020 Traffic Red', inspector: 'Priya Shah', date: '2026-03-13', result: 'Fail', thickness: '45μm', adhesion: '3B', visual: 'Orange peel', notes: 'Under-cured, orange peel texture. Re-coat required.' },
  { id: 'QC-004', batchId: 'B2026-0309', powderType: 'RAL 5015 Sky Blue', inspector: 'Amit Kumar', date: '2026-03-13', result: 'Pass', thickness: '75μm', adhesion: '4B', visual: 'OK', notes: 'Slight variation in thickness, within tolerance.' },
  { id: 'QC-005', batchId: 'B2026-0308', powderType: 'RAL 7035 Light Grey', inspector: 'Priya Shah', date: '2026-03-12', result: 'Pass', thickness: '70μm', adhesion: '5B', visual: 'OK', notes: 'Perfect batch, client approved.' },
  { id: 'QC-006', batchId: 'B2026-0307', powderType: 'RAL 2004 Pure Orange', inspector: 'Raj Mehta', date: '2026-03-12', result: 'Pass', thickness: '71μm', adhesion: '5B', visual: 'OK', notes: 'Bright finish, no defects.' },
  { id: 'QC-007', batchId: 'B2026-0306', powderType: 'RAL 8017 Chocolate Brown', inspector: 'Amit Kumar', date: '2026-03-11', result: 'Fail', thickness: '90μm', adhesion: '2B', visual: 'Runs', notes: 'Over-applied, runs on vertical surfaces. Stripped and re-coated.' },
  { id: 'QC-008', batchId: 'B2026-0305', powderType: 'RAL 1015 Light Ivory', inspector: 'Priya Shah', date: '2026-03-11', result: 'Pass', thickness: '65μm', adhesion: '4B', visual: 'OK', notes: 'Acceptable within spec range.' },
  { id: 'QC-009', batchId: 'B2026-0304', powderType: 'RAL 6018 Yellow Green', inspector: 'Raj Mehta', date: '2026-03-10', result: 'Pass', thickness: '73μm', adhesion: '5B', visual: 'OK', notes: 'Vibrant color, customer satisfied.' },
  { id: 'QC-010', batchId: 'B2026-0303', powderType: 'RAL 7016 Anthracite Grey', inspector: 'Priya Shah', date: '2026-03-10', result: 'Pass', thickness: '69μm', adhesion: '5B', visual: 'OK', notes: 'Matte finish as requested.' },
];

// ── POWDER USAGE OVER 30 DAYS ──
export const powderUsageData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, 13 + i);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    usage: Math.floor(80 + Math.random() * 120),
    target: 150,
  };
});

// ── POWDER USAGE BY TYPE ──
export const powderByTypeData = [
  { name: 'Pure White', used: 1240, jobs: 18, avgPerJob: 69 },
  { name: 'Jet Black', used: 980, jobs: 14, avgPerJob: 70 },
  { name: 'Light Grey', used: 860, jobs: 12, avgPerJob: 72 },
  { name: 'Sky Blue', used: 620, jobs: 9, avgPerJob: 69 },
  { name: 'Traffic Red', used: 450, jobs: 7, avgPerJob: 64 },
  { name: 'Pure Orange', used: 380, jobs: 6, avgPerJob: 63 },
  { name: 'Anthracite Grey', used: 340, jobs: 5, avgPerJob: 68 },
  { name: 'Light Ivory', used: 280, jobs: 4, avgPerJob: 70 },
];

// ── GAS DATA ──
export const gasData = [
  { type: 'Nitrogen (N₂)', capacity: 1500, current: 330, consumedToday: 85, refillDate: '2026-03-18', unit: 'm³' },
  { type: 'Argon (Ar)', capacity: 800, current: 520, consumedToday: 42, refillDate: '2026-03-25', unit: 'm³' },
  { type: 'Carbon Dioxide (CO₂)', capacity: 600, current: 180, consumedToday: 35, refillDate: '2026-03-16', unit: 'm³' },
];

export const gasUsageOverTime = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, 13 + i);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    nitrogen: Math.floor(60 + Math.random() * 50),
    argon: Math.floor(30 + Math.random() * 30),
    co2: Math.floor(20 + Math.random() * 25),
  };
});

// ── ACTIVITY FEED ──
export const activityFeed = [
  { id: 1, action: 'completed QC check', user: 'Priya Shah', target: 'Batch #B2026-0312', time: '2 min ago', type: 'success' },
  { id: 2, action: 'started production on', user: 'Raj Mehta', target: 'Line 2 — RAL 9010', time: '15 min ago', type: 'info' },
  { id: 3, action: 'flagged low stock for', user: 'System', target: 'RAL 3020 Traffic Red', time: '1 hr ago', type: 'warning' },
  { id: 4, action: 'completed task', user: 'Sneha Patel', target: 'Inventory Update RAL 3020', time: '1.5 hrs ago', type: 'success' },
  { id: 5, action: 'failed QC inspection on', user: 'Amit Kumar', target: 'Batch #B2026-0307', time: '3 hrs ago', type: 'danger' },
  { id: 6, action: 'restocked powder', user: 'Vikram Singh', target: 'RAL 7035 Light Grey — 200kg', time: '4 hrs ago', type: 'info' },
  { id: 7, action: 'scheduled gas refill for', user: 'Amit Kumar', target: 'Nitrogen Tank — Mar 18', time: '5 hrs ago', type: 'info' },
  { id: 8, action: 'completed calibration of', user: 'Raj Mehta', target: 'Oven sensors 1–4', time: '6 hrs ago', type: 'success' },
];

// ── QUALITY TREND (30 days) ──
export const qualityTrendData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 1, 13 + i);
  const total = Math.floor(8 + Math.random() * 8);
  const passed = Math.floor(total * (0.85 + Math.random() * 0.15));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    passed,
    failed: total - passed,
    total,
  };
});

// ── KPI DATA ──
export const kpiData = {
  totalPowderStock: 4820,
  tasksCompleted: 14,
  totalTasks: 22,
  qualityPassRate: 97.4,
  gasRemaining: 312,
  gasCapacity: 1500,
};

// ── TEAM MEMBERS ──
export const teamMembers = [
  { id: 1, name: 'Raj Mehta', role: 'Production Lead', email: 'raj@metamorph.in', avatar: 'RM', status: 'Active' },
  { id: 2, name: 'Priya Shah', role: 'QC Inspector', email: 'priya@metamorph.in', avatar: 'PS', status: 'Active' },
  { id: 3, name: 'Amit Kumar', role: 'Maintenance Tech', email: 'amit@metamorph.in', avatar: 'AK', status: 'Active' },
  { id: 4, name: 'Vikram Singh', role: 'Spray Operator', email: 'vikram@metamorph.in', avatar: 'VS', status: 'Active' },
  { id: 5, name: 'Sneha Patel', role: 'Inventory Manager', email: 'sneha@metamorph.in', avatar: 'SP', status: 'Active' },
];
