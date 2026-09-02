import { useState, useEffect } from 'react';
import { useData } from '@context/DataContext';
import { IncomeRecord } from '@lib/types';
import { Button } from '@components/ui/Button';
import { Input, Label, Select, Textarea } from '@components/ui/Input';
import { cn } from '@lib/utils';

interface IncomeModalProps {
  initialData?: IncomeRecord;
  onClose: () => void;
}

const categories = {
  income: ['Salary', 'Freelance', 'Investments', 'Digital Products', 'Bonus', 'Other Income'],
  expense: ['Rent', 'Utilities', 'Software', 'Infrastructure', 'Equipment', 'Taxes', 'Other Expense'],
};

export function IncomeModal({ initialData, onClose }: IncomeModalProps) {
  const { addIncomeRecord, updateIncomeRecord } = useData();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    type: 'income' as IncomeRecord['type'],
    status: 'completed' as IncomeRecord['status'],
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date.split('T')[0],
        description: initialData.description,
        category: initialData.category,
        amount: initialData.amount.toString(),
        type: initialData.type,
        status: initialData.status,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const recordData = {
      date: formData.date,
      description: formData.description.trim(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      type: formData.type,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    if (isEditing && initialData) {
      updateIncomeRecord(initialData.id, recordData);
    } else {
      addIncomeRecord(recordData);
    }
    onClose();
  };

  const availableCategories = categories[formData.type];

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              error={errors.date}
            />
            {errors.date && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.date}</p>}
          </div>
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as IncomeRecord['type'];
                setFormData(prev => ({ 
                  ...prev, 
                  type: newType, 
                  category: categories[newType][0] 
                }));
              }}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., March Salary"
            error={errors.description}
          />
          {errors.description && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
            {errors.category && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.category}</p>}
          </div>
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              error={errors.amount}
            />
            {errors.amount && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.amount}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as IncomeRecord['status'] }))}
          >
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
      </div>

      <div className="modal-footer">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Changes' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}