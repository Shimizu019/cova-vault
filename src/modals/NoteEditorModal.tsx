import { useState, useEffect } from 'react';
import { useData } from '@context/DataContext';
import { Note, Folder } from '@lib/types';
import { Button } from '@components/ui/Button';
import { Input, Label, Textarea, Select } from '@components/ui/Input';
import { cn } from '@lib/utils';

interface NoteEditorModalProps {
  initialData?: Note;
  onClose: () => void;
}

export function NoteEditorModal({ initialData, onClose }: NoteEditorModalProps) {
  const { folders, addNote, updateNote } = useData();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folderId: '',
    favorite: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        folderId: initialData.folderId || '',
        favorite: initialData.favorite,
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const noteData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      folderId: formData.folderId || undefined,
      favorite: formData.favorite,
    };

    if (isEditing && initialData) {
      updateNote(initialData.id, noteData);
    } else {
      addNote(noteData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Note title"
            error={errors.title}
          />
          {errors.title && <p className="text-xs text-light-danger dark:text-dark-danger mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your note here..."
            rows={10}
          />
        </div>

        <div>
          <Label htmlFor="folder">Folder</Label>
          <Select
            id="folder"
            value={formData.folderId}
            onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
          >
            <option value="">No folder</option>
            {folders.filter(f => f.type === 'notes' || f.type === 'mixed').map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="mb-0">Favorite</Label>
          <input
            type="checkbox"
            checked={formData.favorite}
            onChange={(e) => setFormData(prev => ({ ...prev, favorite: e.target.checked }))}
            className="toggle"
            role="switch"
          />
        </div>
      </div>

      <div className="modal-footer">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}