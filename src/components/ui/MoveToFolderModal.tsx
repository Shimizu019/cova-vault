import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import type { Folder } from '@lib/types';

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  currentFolderId?: string;
  onMove: (folderId: string | undefined) => void;
  onCreateFolder?: () => void;
  itemName: string;
}

export function MoveToFolderModal({
  isOpen,
  onClose,
  folders,
  currentFolderId,
  onMove,
  onCreateFolder,
  itemName,
}: MoveToFolderModalProps) {
  const isEmptyState = folders.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move to Folder" size="sm">
      {isEmptyState ? (
        <div className="space-y-4">
          <p className="text-sm text-cova-textMuted">
            You don't have a folder created yet. Do you want to create a folder?
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={onCreateFolder} className="flex-1">
              <Plus className="w-4 h-4" /> Create Folder
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-cova-textMuted mb-3">
            Select a folder for "{itemName}"
          </p>
          <button
            type="button"
            onClick={() => onMove(undefined)}
            className={`w-full px-4 py-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
              !currentFolderId
                ? 'border-cova-primary bg-cova-primary/10 text-cova-primary'
                : 'border-cova-border bg-cova-bg text-cova-text hover:bg-cova-surfaceHover'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="flex-1">No Folder</span>
            {!currentFolderId && (
              <span className="text-xs font-medium">Current</span>
            )}
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onMove(f.id)}
              className={`w-full px-4 py-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                currentFolderId === f.id
                  ? 'border-cova-primary bg-cova-primary/10 text-cova-primary'
                  : 'border-cova-border bg-cova-bg text-cova-text hover:bg-cova-surfaceHover'
              }`}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="flex-1">{f.name}</span>
              {currentFolderId === f.id && (
                <span className="text-xs font-medium">Current</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
