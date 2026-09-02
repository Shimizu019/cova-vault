import { useState } from 'react';
import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { SearchBar } from '@components/ui/SearchBar';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Dropdown } from '@components/ui/Dropdown';
import { Input, Label, Textarea, Select } from '@components/ui/Input';
import { formatRelativeTime, formatDate } from '@lib/utils';
import { Task } from '@lib/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckSquare,
  Clock,
  Flag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { TaskModal } from '@modals/TaskModal';

const statusConfig = {
  todo: { label: 'To Do', icon: CheckSquare, color: 'text-light-textMuted dark:text-dark-textMuted' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-light-warning dark:text-dark-warning' },
  done: { label: 'Done', icon: CheckSquare, color: 'text-light-success dark:text-dark-success' },
} as const;

type TaskStatus = keyof typeof statusConfig;

export function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<TaskStatus, boolean>>({
    todo: false,
    in_progress: false,
    done: false,
  });

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const groupedTasks = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  const toggleCollapse = (status: TaskStatus) => {
    setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const getTaskActions = (task: Task) => [
    { 
      label: 'Edit', 
      icon: <Edit className="w-4 h-4" />, 
      onClick: () => setEditingTask(task) 
    },
    { 
      label: 'Delete', 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => {
        if (confirm('Delete this task?')) deleteTask(task.id);
      },
      danger: true 
    },
  ];

  const renderSection = (status: TaskStatus, items: Task[]) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const isCollapsed = collapsedSections[status];

    if (items.length === 0 && filterStatus !== 'all') return null;

    return (
      <Card key={status} className="flex-1 min-w-[300px]">
        <div className="px-4 py-3 border-b border-light-border dark:border-dark-border">
          <button
            onClick={() => toggleCollapse(status)}
            className="flex items-center gap-2 w-full text-left hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover rounded-lg p-1"
          >
            <Icon className={cn('w-4 h-4', config.color)} />
            <span className="font-medium text-light-text dark:text-dark-text">{config.label}</span>
            <span className="ml-auto text-sm text-light-textMuted dark:text-dark-textMuted bg-light-surfaceHover dark:bg-dark-surfaceHover px-2 py-0.5 rounded">
              {items.length}
            </span>
            {isCollapsed ? <ChevronRight className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted" /> : <ChevronDown className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted" />}
          </button>
        </div>
        {!isCollapsed && (
          <div className="divide-y divide-light-border dark:divide-dark-border max-h-[500px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-center text-sm text-light-textMuted dark:text-dark-textMuted">
                No tasks
              </div>
            ) : (
              items.map((task) => (
                <div key={task.id} className="px-4 py-3 hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                        task.status === 'done' 
                          ? 'bg-light-success dark:bg-dark-success border-light-success dark:border-dark-success text-white' 
                          : 'border-light-border dark:border-dark-border hover:border-light-primary dark:hover:border-dark-primary'
                      )}
                      aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.status === 'done' && <Icon className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', task.status === 'done' ? 'line-through text-light-textMuted dark:text-dark-textMuted' : 'text-light-text dark:text-dark-text')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-light-textMuted dark:text-dark-textMuted">
                        {task.dueDate && (
                          <span className={cn('flex items-center gap-1', new Date(task.dueDate) < new Date() && task.status !== 'done' && 'text-light-danger dark:text-dark-danger')}>
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(task.dueDate)}
                          </span>
                        )}
                        {task.priority && (
                          <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                            {task.priority}
                          </Badge>
                        )}
                        {task.category && (
                          <Badge variant="neutral">{task.category}</Badge>
                        )}
                      </div>
                    </div>
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                      items={getTaskActions(task)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage your tasks and projects"
        search={{
          placeholder: 'Search tasks...',
          value: search,
          onChange: (value) => setSearch(value),
        }}
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        }
      />

      <div className="flex gap-2 mb-4">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status as TaskStatus].label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(status => 
          renderSection(status, groupedTasks[status])
        )}
      </div>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Task" size="lg">
        <TaskModal onClose={() => setShowNewModal(false)} />
      </Modal>

      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" size="lg">
        {editingTask && <TaskModal initialData={editingTask} onClose={() => setEditingTask(null)} />}
      </Modal>
    </div>
  );
}