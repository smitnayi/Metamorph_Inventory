import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePersistedState, useActivityFeed, useAuth } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';

const PRIORITIES = { low: '#10B981', medium: '#FACC15', high: '#F43F5E' };
const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#00D4FF' },
  { id: 'in_progress', title: 'In Progress', color: '#FACC15' },
  { id: 'review', title: 'Review', color: '#E8771A' },
  { id: 'done', title: 'Done', color: '#10B981' }
];

const emptyTask = { title: '', description: '', priority: 'medium', assignee: '', status: 'todo' };

function TaskCard({ task, overlay, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    backgroundColor: 'var(--surface)', border: '1px solid var(--glass-border)',
    opacity: isDragging ? 0.4 : 1, borderRadius: '12px', marginBottom: '8px',
    padding: '12px 14px', cursor: 'grab', position: 'relative'
  };

  const { isAdmin } = useAuth();

  const card = (
    <div ref={!overlay ? setNodeRef : undefined} className="group" style={overlay ? { ...style, opacity: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' } : style}
      {...(!overlay ? { ...attributes, ...listeners } : {})}>
      
      {isAdmin && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      )}

      <div className="flex items-center gap-2 mb-2 pr-6">
        <div className="w-2 h-2 rounded-full" style={{ background: PRIORITIES[task.priority] }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: PRIORITIES[task.priority] }}>{task.priority}</span>
      </div>
      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
      <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
      
      <div className="flex justify-between items-center mt-auto pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2" 
               style={{ background: 'linear-gradient(135deg, #00D4FF, #0077FF)', borderColor: 'var(--surface)' }}>{task.assignee.charAt(0) || 'U'}</div>
        </div>
      </div>
    </div>
  );
  return card;
}

function DroppableColumn({ column, tasks: colTasks, onOpenTask, onDeleteTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className="flex flex-col min-h-[300px]" style={{
      background: isOver ? 'rgba(0, 212, 255, 0.05)' : 'transparent', borderRadius: '12px', transition: 'background 0.2s ease'
    }}>
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: column.color }} />
          <h3 className="font-heading font-semibold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>{column.title}</h3>
        </div>
        <div className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{colTasks.length}</div>
      </div>
      <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {colTasks.map(task => (
            <div key={task.id} onClick={() => onOpenTask(task)}><TaskCard task={task} onDelete={onDeleteTask} /></div>
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
  const [newTask, setNewTask] = useState(emptyTask);
  const [activeTask, setActiveTask] = useState(null);
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { isAdmin } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e) => {
    setActiveTask(tasks.find(t => t.id === e.active.id));
  };

  const handleDragEnd = (e) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id;

    const isOverColumn = COLUMNS.some(c => c.id === overId);
    let newStatus = activeTask.status;

    if (isOverColumn) { newStatus = overId; } 
    else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (activeTask.status !== newStatus) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
      logActivity('You', 'moved task', `"${activeTask.title}" to ${COLUMNS.find(c => c.id === newStatus).title}`, 'info');
    }
  };

  const handleDeleteTask = (id) => {
    if (window.confirm('Delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Task deleted', 'info');
    }
  };

  const handleCreate = () => {
    if (!newTask.title.trim()) { addToast('Task title is required.', 'warning'); return; }
    const task = { id: `T${Date.now()}`, ...newTask };
    setTasks(prev => [...prev, task]);
    setModalOpen(false); setNewTask(emptyTask);
    addToast('Task created successfully!', 'success');
    logActivity('You', 'created a new task', task.title, 'success');
  };

  const tasksByCol = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  const f = (field) => (e) => setNewTask(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Task Manager</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Drag and drop tasks between columns</p>
        </div>
        {isAdmin && (
          <motion.button className="glass-btn-primary text-sm" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Task
          </motion.button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-hidden">
          {COLUMNS.map(col => (
            <GlassCard key={col.id} hover={false} delay={0} className="!p-3 h-full overflow-y-auto hide-scrollbar">
              <DroppableColumn column={col} tasks={tasksByCol[col.id]} onOpenTask={setDetailTask} onDeleteTask={handleDeleteTask} />
            </GlassCard>
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay onDelete={() => {}} /> : null}</DragOverlay>
      </DndContext>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Task" size="md">
        <div className="space-y-4">
          <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Title *</label><input className="glass-input w-full" placeholder="What needs to be done?" value={newTask.title} onChange={f('title')} /></div>
          <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Description</label><textarea className="glass-input w-full min-h-[100px]" placeholder="Add details..." value={newTask.description} onChange={f('description')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label><select className="glass-input w-full" value={newTask.priority} onChange={f('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div><label className="text-xs font-medium uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>Assign To</label><input className="glass-input w-full" placeholder="e.g. Smit" value={newTask.assignee} onChange={f('assignee')} /></div>
          </div>
          <motion.button className="glass-btn-primary w-full justify-center p-3 mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCreate}>Create Task</motion.button>
        </div>
      </Modal>

      <Modal isOpen={!!detailTask} onClose={() => setDetailTask(null)} title={detailTask?.title} size="md">
        {detailTask && (
          <div className="space-y-6">
            <div className="flex items-center gap-3"><div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: `${PRIORITIES[detailTask.priority]}20`, color: PRIORITIES[detailTask.priority] }}>{detailTask.priority} Priority</div><div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>{COLUMNS.find(c => c.id === detailTask.status)?.title}</div></div>
            <div><h4 className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Description</h4><p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{detailTask.description || 'No description provided.'}</p></div>
            <div className="pt-4 flex justify-end" style={{ borderTop: '1px solid var(--divider)' }}><button onClick={() => setDetailTask(null)} className="glass-btn px-6 py-2">Close</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
