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
import { Input, Label, Select } from '@components/ui/Input';
import { formatCurrency, formatDate } from '@lib/utils';
import { IncomeRecord } from '@lib/types';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';
import { IncomeModal } from '@modals/IncomeModal';

export function Income() {
  const { incomeRecords, addIncomeRecord, updateIncomeRecord, deleteIncomeRecord } = useData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);

  const filteredRecords = incomeRecords.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const completedRecords = incomeRecords.filter(r => r.status === 'completed');
  const totalIncome = completedRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = completedRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  const getRecordActions = (record: IncomeRecord) => [
    { 
      label: 'Edit', 
      icon: <Edit className="w-4 h-4" />, 
      onClick: () => setEditingRecord(record) 
    },
    { 
      label: 'Delete', 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => {
        if (confirm('Delete this record?')) deleteIncomeRecord(record.id);
      },
      danger: true 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        subtitle="Track your income and expenses"
        search={{
          placeholder: 'Search records...',
          value: search,
          onChange: (value) => setSearch(value),
        }}
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            Add Record
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-light-successLight dark:bg-dark-successLight flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-light-success dark:text-dark-success" />
              </div>
              <div>
                <p className="text-xs text-light-textMuted dark:text-dark-textMuted">Total Income</p>
                <p className="text-lg font-semibold text-light-success dark:text-dark-success">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-light-dangerLight dark:bg-dark-dangerLight flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-light-danger dark:text-dark-danger" />
              </div>
              <div>
                <p className="text-xs text-light-textMuted dark:text-dark-textMuted">Total Expenses</p>
                <p className="text-lg font-semibold text-light-danger dark:text-dark-danger">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-light-primaryLight dark:bg-dark-primaryLight flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-light-primary dark:text-dark-primary" />
              </div>
              <div>
                <p className="text-xs text-light-textMuted dark:text-dark-textMuted">Net Income</p>
                <p className={cn('text-lg font-semibold', netIncome >= 0 ? 'text-light-success dark:text-dark-success' : 'text-light-danger dark:text-dark-danger')}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 bg-light-surfaceHover dark:bg-dark-surfaceHover rounded-lg p-1">
          {(['all', 'income', 'expense'] as const).map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(type)}
              className="gap-1"
            >
              {type === 'income' && <TrendingUp className="w-3 h-3" />}
              {type === 'expense' && <TrendingDown className="w-3 h-3" />}
              <span className="capitalize">{type}</span>
            </Button>
          ))}
        </div>
        <div className="flex gap-1 bg-light-surfaceHover dark:bg-dark-surfaceHover rounded-lg p-1 ml-auto">
          {(['all', 'completed', 'pending', 'cancelled'] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-surfaceHover dark:bg-dark-surfaceHover flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-light-textMuted dark:text-dark-textMuted" />
            </div>
            <h3 className="text-sm font-medium text-light-textSecondary dark:text-dark-textSecondary mb-1">
              {search || filterType !== 'all' || filterStatus !== 'all' ? 'No records found' : 'No records yet'}
            </h3>
            <p className="text-xs text-light-textMuted dark:text-dark-textMuted mb-4">
              {search || filterType !== 'all' || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first income or expense record'}
            </p>
            {!search && filterType === 'all' && filterStatus === 'all' && (
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="w-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="whitespace-nowrap">{formatDate(record.date)}</td>
                    <td className="font-medium text-light-text dark:text-dark-text">{record.description}</td>
                    <td><Badge variant="neutral">{record.category}</Badge></td>
                    <td className="text-right font-mono">
                      <span className={cn(record.type === 'income' ? 'text-light-success dark:text-dark-success' : 'text-light-danger dark:text-dark-danger')}>
                        {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={record.type === 'income' ? 'success' : 'danger'}>
                        {record.type === 'income' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {record.type}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={record.status === 'completed' ? 'success' : record.status === 'pending' ? 'warning' : 'danger'}>
                        {record.status}
                      </Badge>
                    </td>
                    <td>
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="text-light-textMuted dark:text-dark-textMuted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded hover:bg-light-surfaceHover dark:hover:bg-dark-surfaceHover">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                        items={getRecordActions(record)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Record" size="lg">
        <IncomeModal onClose={() => setShowNewModal(false)} />
      </Modal>

      <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title="Edit Record" size="lg">
        {editingRecord && <IncomeModal initialData={editingRecord} onClose={() => setEditingRecord(null)} />}
      </Modal>
    </div>
  );
}