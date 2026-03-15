import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePersistedState, useActivityFeed } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748B' },
  { id: 'inprogress', label: 'In Progress', color: '#F5A623' },
  { id: 'done', label: 'Completed', color: '#22C55E' },
];

const PRIORITIES = { high: '#EF4444', medium: '#F5A623', low: '#22C55E' };

const emptyTask = { title: '', description: '', priority: 'medium', assignee: '', status: 'todo' };

function TaskCard({ task, overlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    opacity: isDragging ? 0.4 : 1,
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 12,
    padding: '12px 14px', cursor: 'grab',
  };

  const card = (
    <div ref={!overlay ? setNodeRef : undefined} style={overlay ? { ...style, opacity: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' } : style}
      {...(!overlay ? { ...attributes, ...listeners } : {})}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: PRIORITIES[task.priority] }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: PRIORITIES[task.priority] }}>{task.priority}</span>
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
      {task.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>}
      {task.assignee && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>
            {task.assignee.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.assignee}</span>
        </div>
      )}
    </div>
  );
  return card;
}

function DroppableColumn({ column, tasks: colTasks, onOpenTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className="flex flex-col min-h-[300px]" style={{
      background: isOver ? 'var(--surface-hover)' : 'transparent',
      borderRadius: 16, padding: '8px', transition: 'background 0.2s',
    }}>
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: column.color }}>{column.label}</span>
        <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>{colTasks.length}</span>
      </div>
      <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {colTasks.map(task => (
            <div key={task.id} onClick={() => onOpenTask(task)}><TaskCard task={task} /></div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TaskManager() {
  const [tasks, setTasks] = usePersistedState('tasks', []);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [form, setForm] = useState(emptyTask);
  const [activeId, setActiveId] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const tasksByCol = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id;
    let targetCol = over.id;
    if (!COLUMNS.find(c => c.id === targetCol)) {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) targetCol = overTask.status;
      else return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetCol } : t));
  };

  const handleNewTask = () => {
    if (!form.title.trim()) { addToast('Task title is required.', 'warning'); return; }
    const task = { id: Date.now(), ...form, createdAt: new Date().toLocaleString() };
    setTasks(prev => [...prev, task]);
    setForm(emptyTask);
    setModalOpen(false);
    addToast('Task created!', 'success');
    logActivity('You', 'created task', form.title, 'success');
  };

  const handleDeleteTask = (id) => {
    const t = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setDetailTask(null);
    addToast('Task deleted.', 'info');
    if (t) logActivity('You', 'deleted task', t.title, 'danger');
  };

  const handleMoveTask = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    setDetailTask(prev => prev ? { ...prev, status: newStatus } : null);
    addToast(`Task moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`, 'info');
  };

  const nf = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Task Manager</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Drag and drop tasks between columns</p>
        </div>
        <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Task
        </motion.button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <GlassCard key={col.id} hover={false} delay={0} className="!p-3">
              <DroppableColumn column={col} tasks={tasksByCol[col.id]} onOpenTask={setDetailTask} />
            </GlassCard>
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
      </DndContext>

      {tasks.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="text-xs mt-1 opacity-60">Click "New Task" to create your first task</p>
        </div>
      )}

      {/* New task modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Task">
        <div className="space-y-4">
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Title *</label><input className="glass-input w-full" placeholder="Task title" value={form.title} onChange={nf('title')} /></div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label><textarea className="glass-input w-full" placeholder="Details…" value={form.description} onChange={nf('description')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
              <select className="glass-input w-full" value={form.priority} onChange={nf('priority')}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
            </div>
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Assignee</label><input className="glass-input w-full" placeholder="Name" value={form.assignee} onChange={nf('assignee')} /></div>
          </div>
          <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Column</label>
            <select className="glass-input w-full" value={form.status} onChange={nf('status')}><option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="done">Completed</option></select>
          </div>
          <motion.button className="glass-btn-primary w-full py-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleNewTask}>Create Task</motion.button>
        </div>
      </Modal>

      {/* Task detail modal */}
      <Modal isOpen={!!detailTask} onClose={() => setDetailTask(null)} title={detailTask?.title || 'Task Detail'}>
        {detailTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITIES[detailTask.priority] }} />
              <span className="text-xs font-bold uppercase" style={{ color: PRIORITIES[detailTask.priority] }}>{detailTask.priority} priority</span>
            </div>
            {detailTask.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{detailTask.description}</p>}
            {detailTask.assignee && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Assigned to: <span style={{ color: 'var(--text-primary)' }}>{detailTask.assignee}</span></p>}
            <div><label className="text-xs font-medium uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>Move to</label>
              <div className="flex gap-2">{COLUMNS.map(col => (
                <motion.button key={col.id} className={`flex-1 py-2 rounded-lg text-xs font-medium ${detailTask.status === col.id ? 'opacity-50' : ''}`}
                  style={{ background: detailTask.status === col.id ? 'var(--surface)' : 'var(--btn-bg)', color: col.color, border: `1px solid ${col.color}30` }}
                  disabled={detailTask.status === col.id} whileTap={{ scale: 0.95 }}
                  onClick={() => handleMoveTask(detailTask.id, col.id)}>{col.label}</motion.button>
              ))}</div>
            </div>
            <motion.button className="w-full py-2 rounded-lg text-sm text-danger" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              whileTap={{ scale: 0.97 }} onClick={() => handleDeleteTask(detailTask.id)}>Delete Task</motion.button>
          </div>
        )}
      </Modal>
    </div>
  );
}
