import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tasksData } from '../data/mockData';
import Modal from '../components/Modal';
import { useToast } from '../App';

const priorityColors = { High: '#EF4444', Medium: '#F5A623', Low: '#22C55E' };
const tagColors = {
  Production: '#00D4FF',
  Quality: '#F5A623',
  Maintenance: '#22C55E',
  Inventory: '#A78BFA',
  Safety: '#64748B',
};

// ----- TaskCard (sortable) -----
function TaskCard({ task, onClick, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    cursor: isDragOverlay ? 'grabbing' : 'grab',
    userSelect: 'none',
  };

  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} {...listeners} onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text-primary leading-tight flex-1 mr-2">
          {task.title}
        </h4>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
          style={{ background: priorityColors[task.priority], boxShadow: `0 0 6px ${priorityColors[task.priority]}` }}
        />
      </div>
      <p className="text-xs text-text-muted line-clamp-2 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold"
            style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}
          >
            {task.avatar}
          </div>
          <span className="text-xs text-text-muted">{task.assignee.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-md font-medium"
            style={{ background: `${tagColors[task.tag]}20`, color: tagColors[task.tag] }}
          >
            {task.tag}
          </span>
          <span className="text-[10px] text-text-muted font-mono">{task.dueTime}</span>
        </div>
      </div>
    </div>
  );
}

// ----- KanbanColumn (droppable) -----
function KanbanColumn({ id, title, tasks, color, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <h3 className="font-heading font-semibold text-sm text-text-primary">{title}</h3>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#64748B' }}
        >
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="rounded-xl p-2 min-h-[400px] transition-colors"
        style={{
          background: isOver ? 'rgba(245,166,35,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isOver ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.04)'}`,
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick(task);
              }}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-text-muted text-xs">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// helper: which column does a task belong to?
const getColumnForTask = (taskId, tasks) => tasks.find((t) => t.id === taskId)?.status ?? null;

export default function TaskManager() {
  const [tasks, setTasks] = useState(tasksData);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // drag overlay
  const [filter, setFilter] = useState('All');
  const addToast = useToast();

  // new task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newAssignee, setNewAssignee] = useState('Raj Mehta');
  const [newTag, setNewTag] = useState('Production');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const COLUMNS = {
    todo: { title: 'To Do', color: '#64748B' },
    inprogress: { title: 'In Progress', color: '#F5A623' },
    done: { title: 'Completed', color: '#22C55E' },
  };

  const filteredTasks = filter === 'All' ? tasks : tasks.filter((t) => t.priority === filter);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const fromStatus = getColumnForTask(active.id, tasks);
    // over.id could be a column ID or another task ID
    const toStatus = COLUMNS[over.id] ? over.id : getColumnForTask(over.id, tasks);

    if (!toStatus || fromStatus === toStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: toStatus } : t))
    );
    addToast(`Task moved to ${COLUMNS[toStatus]?.title}`, 'info');
  };

  const createTask = () => {
    if (!newTitle.trim()) return;
    const avatarMap = {
      'Raj Mehta': 'RM', 'Priya Shah': 'PS', 'Amit Kumar': 'AK',
      'Vikram Singh': 'VS', 'Sneha Patel': 'SP',
    };
    const newTask = {
      id: `t${Date.now()}`,
      title: newTitle,
      description: newDesc || 'No description provided.',
      assignee: newAssignee,
      avatar: avatarMap[newAssignee] ?? 'XX',
      priority: newPriority,
      dueTime: 'TBD',
      tag: newTag,
      status: 'todo',
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskModal(false);
    setNewTitle(''); setNewDesc('');
    addToast('New task created!', 'success');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-text-primary">Task Manager</h2>
          <p className="text-text-muted text-sm mt-1">
            Today's tasks —{' '}
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1">
            {['All', 'High', 'Medium', 'Low'].map((f) => (
              <motion.button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filter === f
                    ? 'bg-amber/20 text-amber border border-amber/30'
                    : 'text-text-muted hover:text-text-primary glass-btn'
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
              >
                {f}
              </motion.button>
            ))}
          </div>
          <motion.button
            className="glass-btn-primary text-sm flex items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setNewTaskModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Task
          </motion.button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(COLUMNS).map(([key, col]) => {
          const count = filteredTasks.filter((t) => t.status === key).length;
          return (
            <div key={key} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-text-muted">{col.title}</span>
              <span className="font-mono font-bold" style={{ color: col.color }}>{count}</span>
            </div>
          );
        })}
        <span className="text-text-muted text-sm ml-auto">
          Total: <span className="text-text-primary font-mono font-bold">{filteredTasks.length}</span>
        </span>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(COLUMNS).map(([status, col]) => (
            <KanbanColumn
              key={status}
              id={status}
              title={col.title}
              color={col.color}
              tasks={filteredTasks.filter((t) => t.status === status)}
              onTaskClick={(task) => { setSelectedTask(task); setTaskModalOpen(true); }}
            />
          ))}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragOverlay onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Task Details" size="md">
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-heading font-bold text-text-primary">{selectedTask.title}</h4>
              <p className="text-sm text-text-muted mt-2">{selectedTask.description}</p>
            </div>
            <div className="glow-divider" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Assigned To</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'rgba(245,166,35,0.2)', color: '#F5A623' }}>
                    {selectedTask.avatar}
                  </div>
                  <span className="text-sm text-text-primary">{selectedTask.assignee}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Priority</p>
                <span className="badge text-xs" style={{
                  background: `${priorityColors[selectedTask.priority]}20`,
                  color: priorityColors[selectedTask.priority],
                  border: `1px solid ${priorityColors[selectedTask.priority]}30`,
                }}>
                  {selectedTask.priority}
                </span>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Due Time</p>
                <span className="text-sm font-mono text-text-primary">{selectedTask.dueTime}</span>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tag</p>
                <span className="text-sm px-2 py-0.5 rounded-md"
                  style={{ background: `${tagColors[selectedTask.tag]}15`, color: tagColors[selectedTask.tag] }}>
                  {selectedTask.tag}
                </span>
              </div>
            </div>
            <div className="glow-divider" />
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Move to Column</p>
              <div className="flex gap-2">
                {Object.entries(COLUMNS).map(([s, col]) => (
                  <motion.button
                    key={s}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${
                      selectedTask.status === s
                        ? 'bg-amber/20 text-amber border border-amber/30'
                        : 'glass-btn text-text-muted'
                    }`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, status: s } : t));
                      setSelectedTask((prev) => ({ ...prev, status: s }));
                      addToast(`Task moved to ${col.title}!`, 'success');
                    }}
                  >
                    {col.title}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Add Comment</p>
              <textarea className="glass-input w-full h-20 resize-none" placeholder="Write a comment..." />
            </div>
            <motion.button
              className="glass-btn-primary w-full py-2.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setTaskModalOpen(false);
                addToast('Changes saved!', 'success');
              }}
            >
              Save Changes
            </motion.button>
          </div>
        )}
      </Modal>

      {/* New Task Modal */}
      <Modal isOpen={newTaskModal} onClose={() => setNewTaskModal(false)} title="Create New Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">Task Title *</label>
            <input type="text" className="glass-input w-full" placeholder="e.g. Prepare batch for Line 1"
              value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">Description</label>
            <textarea className="glass-input w-full h-20 resize-none" placeholder="Details about the task..."
              value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">Priority</label>
              <select className="glass-input w-full" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">Assign To</label>
              <select className="glass-input w-full" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                <option>Raj Mehta</option><option>Priya Shah</option><option>Amit Kumar</option>
                <option>Vikram Singh</option><option>Sneha Patel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted font-medium uppercase tracking-wider block mb-1.5">Tag</label>
              <select className="glass-input w-full" value={newTag} onChange={(e) => setNewTag(e.target.value)}>
                <option>Production</option><option>Quality</option><option>Maintenance</option>
                <option>Inventory</option><option>Safety</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <motion.button
              className="glass-btn-primary w-full py-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={createTask}
            >
              Create Task
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
