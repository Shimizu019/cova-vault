import { useState, useEffect } from 'react';
import { useData } from '@context/DataContext';
import { cn } from '@lib/utils';
import { PageHeader } from '@components/ui/PageHeader';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Card, CardContent } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Dropdown } from '@components/ui/Dropdown';
import { Input, Label, Select } from '@components/ui/Input';
import { Folder } from '@lib/types';
import { 
  Plus, 
  FolderKanban, 
  FolderOpen, 
  Edit, 
  Trash2, 
  MoreVertical,
  ChevronLeft,
  Database,
  FileText,
  CheckSquare,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';

const folderIcons = {
  credentials: Database,
  notes: FileText,
  tasks: CheckSquare,
  mixed: FolderKanban,
};

type ViewMode = 'grid' | 'list';
type ActiveTab = 'passwords' | 'notes';

export function Folders() {
  const { folders, credentials: allCredentials, notes: allNotes, tasks: allTasks, addFolder, updateFolder, deleteFolder } = useData();
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [currentPath, setCurrentPath] = useState<Folder[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('passwords');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const getFolderCounts = (folder: Folder) => {
    let credCount = 0, noteCount = 0, taskCount = 0;
    
    if (folder.type === 'credentials' || folder.type === 'mixed') {
      credCount = allCredentials.filter(c => c.folderId === folder.id).length;
    }
    if (folder.type === 'notes' || folder.type === 'mixed') {
      noteCount = allNotes.filter(n => n.folderId === folder.id).length;
    }
    if (folder.type === 'tasks' || folder.type === 'mixed') {
      taskCount = allTasks.filter(t => t.folderId === folder.id).length;
    }
    
    return { credCount, noteCount, taskCount };
  };

  const getFolderActions = (folder: Folder) => [
    { 
      label: 'Edit', 
      icon: <Edit className="w-4 h-4" />, 
      onClick: () => setEditingFolder(folder) 
    },
    { 
      label: 'Delete', 
      icon: <Trash2 className="w-4 h-4" />, 
      onClick: () => {
        if (confirm('Delete this folder? Items will be moved to root.')) deleteFolder(folder.id);
      },
      danger: true 
    },
  ];

  const currentFolder = currentPath[currentPath.length - 1];
  const childFolders = folders.filter(f => f.parentId === (currentFolder?.id || null));

  const filteredFolders = childFolders.filter(f => {
    if (activeTab === 'passwords') {
      return f.type === 'credentials' || f.type === 'mixed';
    }
    return f.type === 'notes' || f.type === 'mixed';
  });

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredFolders.length === 0 && currentPath.length === 0 ? (
        <div className="col-span-full">
          <Card className="h-full bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-[#666]" />
              </div>
              <h3 className="text-sm font-medium text-[#888] mb-1">
                No folders yet
              </h3>
              <p className="text-xs text-[#666] mb-4">
                Create folders to organize your credentials, notes, and tasks
              </p>
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Create Folder
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="col-span-full">
          <Card className="h-full bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-[#666]" />
              </div>
              <h3 className="text-sm font-medium text-[#888] mb-1">
                This folder is empty
              </h3>
              <p className="text-xs text-[#666] mb-4">
                Create a subfolder or add items to this folder
              </p>
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="w-4 h-4" />
                Create Subfolder
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        filteredFolders.map((folder) => {
          const Icon = folderIcons[folder.type] || FolderKanban;
          const counts = getFolderCounts(folder);
          const totalItems = counts.credCount + counts.noteCount + counts.taskCount;

          return (
            <Card key={folder.id} className="h-full bg-[#1a1a1a] border-[#333]">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', folder.color ? `bg-[${folder.color}]/20` : 'bg-[#222]')}>
                    <Icon className="w-5 h-5" style={{ color: folder.color || undefined }} />
                  </div>
                  <Dropdown
                    align="right"
                    trigger={
                      <button className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={getFolderActions(folder)}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white truncate mb-1">{folder.name}</h3>
                  <p className="text-xs text-[#666] mb-3">
                    {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#666]">
                    {counts.credCount > 0 && (
                      <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                        <Database className="w-3 h-3" />
                        {counts.credCount}
                      </Badge>
                    )}
                    {counts.noteCount > 0 && (
                      <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                        <FileText className="w-3 h-3" />
                        {counts.noteCount}
                      </Badge>
                    )}
                    {counts.taskCount > 0 && (
                      <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                        <CheckSquare className="w-3 h-3" />
                        {counts.taskCount}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPath([...currentPath, folder])}
                  className="mt-4 w-full text-left text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1"
                >
                  Open <ChevronRight className="w-3 h-3" />
                </button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredFolders.length === 0 && currentPath.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-[#666]" />
            </div>
            <h3 className="text-sm font-medium text-[#888] mb-1">
              No folders yet
            </h3>
            <p className="text-xs text-[#666] mb-4">
              Create folders to organize your credentials, notes, and tasks
            </p>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4" />
              Create Folder
            </Button>
          </CardContent>
        </Card>
      ) : filteredFolders.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#222] flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-[#666]" />
            </div>
            <h3 className="text-sm font-medium text-[#888] mb-1">
              This folder is empty
            </h3>
            <p className="text-xs text-[#666] mb-4">
              Create a subfolder or add items to this folder
            </p>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4" />
              Create Subfolder
            </Button>
          </CardContent>
        </Card>
      ) : (
        filteredFolders.map((folder) => {
          const Icon = folderIcons[folder.type] || FolderKanban;
          const counts = getFolderCounts(folder);
          const totalItems = counts.credCount + counts.noteCount + counts.taskCount;

          return (
            <Card key={folder.id} className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', folder.color ? `bg-[${folder.color}]/20` : 'bg-[#222]')}>
                    <Icon className="w-5 h-5" style={{ color: folder.color || undefined }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{folder.name}</h3>
                      <span className="text-xs text-[#666]">{totalItems} items</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#666] mt-1">
                      {counts.credCount > 0 && (
                        <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                          <Database className="w-3 h-3" />
                          {counts.credCount}
                        </Badge>
                      )}
                      {counts.noteCount > 0 && (
                        <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                          <FileText className="w-3 h-3" />
                          {counts.noteCount}
                        </Badge>
                      )}
                      {counts.taskCount > 0 && (
                        <Badge variant="neutral" className="gap-1 bg-[#222] text-[#888]">
                          <CheckSquare className="w-3 h-3" />
                          {counts.taskCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Dropdown
                    align="right"
                    trigger={
                      <button className="text-[#666] hover:text-white p-1 rounded hover:bg-[#222] transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                    items={getFolderActions(folder)}
                  />
                  <button
                    onClick={() => setCurrentPath([...currentPath, folder])}
                    className="text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 px-2 py-1 rounded hover:bg-[#222]"
                  >
                    Open <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folders"
        subtitle="Organize your items into folders"
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" />
            New Folder
          </Button>
        }
      />

      {currentPath.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[#666] mb-4">
          <button 
            onClick={() => setCurrentPath([])}
            className="hover:text-white flex items-center gap-1"
          >
            <FolderKanban className="w-4 h-4" />
            Root
          </button>
          {currentPath.map((folder, index) => (
            <span key={folder.id} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              <button 
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                className="hover:text-white"
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#333] rounded-lg p-1">
          {[
            { id: 'passwords', label: 'Passwords', icon: Database },
            { id: 'notes', label: 'Notes', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-[#666] hover:text-white hover:bg-[#222]'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1a1a] border border-[#333] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5 rounded transition-colors', viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white')}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5 rounded transition-colors', viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white')}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? renderGridView() : renderListView()}

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Folder" size="md">
        <FolderModal 
          parentId={currentFolder?.id} 
          onClose={() => setShowNewModal(false)} 
        />
      </Modal>

      <Modal isOpen={!!editingFolder} onClose={() => setEditingFolder(null)} title="Edit Folder" size="md">
        {editingFolder && <FolderModal initialData={editingFolder} onClose={() => setEditingFolder(null)} />}
      </Modal>
    </div>
  );
}

function FolderModal({ initialData, parentId, onClose }: { initialData?: Folder; parentId?: string; onClose: () => void }) {
  const { folders, addFolder, updateFolder } = useData();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    type: 'mixed' as Folder['type'],
    color: '#3B82F6',
    icon: 'folder-kanban',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        color: initialData.color || '#3B82F6',
        icon: initialData.icon || 'folder-kanban',
      });
    } else if (parentId) {
      const parent = folders.find(f => f.id === parentId);
      if (parent) {
        setFormData(prev => ({ ...prev, type: parent.type, color: parent.color || '#3B82F6', icon: parent.icon || 'folder-kanban' }));
      }
    }
  }, [initialData, parentId, folders]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Folder name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const folderData = {
      name: formData.name.trim(),
      parentId: parentId || (initialData?.parentId),
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
    };

    if (isEditing && initialData) {
      updateFolder(initialData.id, folderData);
    } else {
      addFolder(folderData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body space-y-4">
        <div>
          <Label htmlFor="name">Folder Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Folder name"
            error={errors.name}
            className="bg-[#111] border-[#333] text-white placeholder-[#666] focus:border-[#555]"
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Folder['type'] }))}
            className="bg-[#111] border-[#333] text-white focus:border-[#555]"
          >
            <option value="credentials">Passwords</option>
            <option value="notes">Notes</option>
            <option value="tasks">Tasks</option>
            <option value="mixed">Mixed</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="h-10 w-10 p-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="modal-footer">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary">
          {isEditing ? 'Save Changes' : 'Create Folder'}
        </Button>
      </div>
    </form>
  );
}