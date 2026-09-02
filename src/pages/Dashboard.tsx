import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { StatCard } from '@components/ui/StatCard';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { formatRelativeTime, formatCurrency, getServiceNameFromUrl } from '@lib/utils';
import { 
  Database, 
  FileText, 
  CheckSquare, 
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Download,
} from 'lucide-react';

export function Dashboard() {
  const { credentials, notes, tasks, incomeRecords, user } = useData();

  const stats = [
    { label: 'Credentials', value: credentials.length, icon: <Database className="w-5 h-5" /> },
    { label: 'Notes', value: notes.length, icon: <FileText className="w-5 h-5" /> },
    { label: 'Open Tasks', value: tasks.filter(t => t.status !== 'done').length, icon: <CheckSquare className="w-5 h-5" /> },
    { 
      label: `Income (${new Date().toLocaleString('default', { month: 'short' })})`, 
      value: formatCurrency(
        incomeRecords
          .filter(r => r.status === 'completed' && r.type === 'income')
          .reduce((sum, r) => sum + r.amount, 0)
      ), 
      icon: <DollarSign className="w-5 h-5" /> 
    },
  ];

  const upcomingTasks = tasks
    .filter(t => t.status !== 'done' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const recentIncome = incomeRecords
    .filter(r => r.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">
          Good to see you, {user.name.split(' ')[0]}.
        </h1>
        <p className="text-sm text-[#888] mt-0.5">
          Here's everything across your Life OS.
        </p>
      </div>

      <Card className="bg-[#1a1a1a] border border-[#333]">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-[#ff9900]/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-[#ff9900]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#ff9900]">No backup yet</p>
            <p className="text-xs text-[#888]">Your vault lives on this device. Back it up to avoid data loss.</p>
          </div>
          <Button variant="secondary" size="sm">
            <Download className="w-3 h-3 mr-1" />
            Back up now
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#1a1a1a] border border-[#333]">
          <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Upcoming Tasks</h3>
            <span className="text-xs text-[#666]">{tasks.filter(t => t.status !== 'done').length} remaining</span>
          </div>
          <div className="divide-y divide-[#333]">
            {upcomingTasks.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#666]">
                No upcoming tasks
              </div>
            ) : (
              upcomingTasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#222]">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    task.priority === 'high' && 'bg-[#ef4444]',
                    task.priority === 'medium' && 'bg-[#eab308]',
                    task.priority === 'low' && 'bg-[#22c55e]'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{task.title}</p>
                    <p className="text-xs text-[#666]">
                      {task.dueDate ? formatRelativeTime(task.dueDate) : 'No due date'}
                    </p>
                  </div>
                  <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="bg-[#1a1a1a] border border-[#333]">
          <div className="px-4 py-3 border-b border-[#333] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Income</h3>
            <span className="text-xs text-[#666]">{incomeRecords.filter(r => r.status === 'completed').length} entries</span>
          </div>
          <div className="divide-y divide-[#333]">
            {recentIncome.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#666]">
                No income records
              </div>
            ) : (
              recentIncome.map((record) => (
                <div key={record.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#222]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{record.description}</p>
                    <p className="text-xs text-[#666]">{formatRelativeTime(record.date)}</p>
                  </div>
                  <span className="text-sm font-mono text-[#22c55e] whitespace-nowrap">
                    +{formatCurrency(record.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}