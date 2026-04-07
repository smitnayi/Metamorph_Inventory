import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth, useActivityFeed } from '../store/useStore';
import GlassCard from '../components/GlassCard';
import Modal from '../components/Modal';
import { useToast } from '../App';
import { api } from '../services/api';
import { Button } from '../components/ui/moving-border';

const PRIORITIES = { low: '#10B981', medium: '#FACC15', high: '#F43F5E' };
const COLUMNS = [
  { id: 'todo', title: 'To Do', color: '#00D4FF' },
  { id: 'in_progress', title: 'In Progress', color: '#FACC15' },
  { id: 'review', title: 'Review', color: '#E8771A' },
  { id: 'done', title: 'Done', color: '#10B981' }
];

const emptyTask = { title: '', description: '', priority: 'medium', assignee: '', status: 'todo' };

function TaskCard({ task, overlay, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id.toString() });
  const style = {
    transform: CSS.Transform.toString(transform), transition,
    backgroundColor: 'var(--surface)', border: '1px solid var(--glass-border)',
    opacity: isDragging ? 0.4 : 1, borderRadius: '12px', marginBottom: '8px',
    padding: '12px 14px', cursor: 'grab', position: 'relative'
  };

  const { permissions } = useAuth();

  const card = (
    <div ref={!overlay ? setNodeRef : undefined} className="group" style={overlay ? { ...style, opacity: 1, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' } : style}
      {...(!overlay ? { ...attributes, ...listeners } : {})}>
      
      {permissions.canDelete && onDelete && (
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
      
      {task.assignee && (
        <div className="flex items-center gap-2 mt-2 pt-3 border-t" style={{ borderColor: 'var(--divider)' }}>
          <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-[10px] font-bold">
            {task.assignee.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{task.assignee}</span>
        </div>
      )}
    </div>
  );
  return card;
}

function Column({ id, title, color, tasks, onDelete }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <GlassCard className="flex flex-col h-full !p-3">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
          <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10" style={{ color: 'var(--text-muted)' }}>{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-[150px] p-2 rounded-xl transition-colors" style={{ background: 'var(--surface-hover)' }}>
        <SortableContext items={tasks.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <TaskCard key={task.id} task={task} onDelete={onDelete} />)}
        </SortableContext>
      </div>
    </GlassCard>
  );
}

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState(emptyTask);
  const [activeId, setActiveId] = useState(null);
  
  const addToast = useToast();
  const { logActivity } = useActivityFeed();
  const { permissions, user } = useAuth();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tasks/');
      setTasks(data);
    } catch (err) {
      addToast('Failed to load tasks', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e) => setActiveId(e.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;
    
    const taskIndex = tasks.findIndex(t => t.id.toString() === taskId.toString());
    if (taskIndex === -1) return;
    
    // Check if dropping over a column or another task
    let targetStatus = null;
    if (COLUMNS.find(c => c.id === overId)) {
      targetStatus = overId;
    } else {
      const overTask = tasks.find(t => t.id.toString() === overId.toString());
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && targetStatus !== tasks[taskIndex].status) {
      // Optimistic UI update
      const prevTasks = [...tasks];
      setTasks(prev => prev.map(t => t.id.toString() === taskId.toString() ? { ...t, status: targetStatus } : t));
      
      try {
        await api.put(`/tasks/${taskId}/`, { ...tasks[taskIndex], status: targetStatus });
        logActivity(user.username, `moved task to ${targetStatus}`, tasks[taskIndex].title, 'info');
      } catch (err) {
        setTasks(prevTasks); // Revert
        addToast('Failed to move task', 'danger');
      }
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) { addToast('Task title is required', 'warning'); return; }
    
    try {
      await api.post('/tasks/', newTask);
      addToast('Task created successfully', 'success');
      logActivity(user.username, 'created new task', newTask.title, 'success');
      setIsModalOpen(false);
      setNewTask(emptyTask);
      fetchTasks();
    } catch (err) {
      addToast('Failed to create task', 'danger');
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
          await api.delete(`/tasks/${id}/`);
          addToast('Task deleted', 'info');
          fetchTasks();
      } catch (err) {
          addToast('Failed to delete task', 'danger');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
           <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Production Kanban</h1>
           <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Drag and drop to track shop floor workflows</p>
        </div>
        {permissions.canCreate && (
          <Button
            duration={3000}
            onClick={() => setIsModalOpen(true)}
            containerClassName="w-40 h-10"
            className="bg-zinc-900 border-zinc-800 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>
            Add New Task
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        {loading ? (
           <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading workflows...</div>
        ) : (
          <div className="flex h-full gap-4 min-w-[900px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {COLUMNS.map(col => (
                <div key={col.id} className="flex-1 min-w-[280px]">
                  <Column id={col.id} title={col.title} color={col.color} tasks={tasks.filter(t => t.status === col.id)} onDelete={deleteTask} />
                </div>
              ))}
              <DragOverlay>
                {activeId ? <TaskCard task={tasks.find(t => t.id.toString() === activeId.toString())} overlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <div className="space-y-4">
           <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Task Title</label><input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="e.g. Prep Substrate Batch A" /></div>
           <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Description</label><textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} rows="3" className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="Any special requirements..." /></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Priority</label>
                 <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }}>
                   <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
                 </select>
              </div>
              <div><label className="block text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-muted)' }}>Assignee</label><input type="text" value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full bg-black/5 dark:bg-white/5 border rounded-lg px-3 py-2 text-sm focus:outline-orange-500" style={{ borderColor: 'var(--divider)', color: 'var(--text-primary)' }} placeholder="e.g. John Doe" /></div>
           </div>
           <button onClick={createTask} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg text-sm mt-4 transition-colors">Create Task in Backlog</button>
        </div>
      </Modal>
    </div>
  );
}
