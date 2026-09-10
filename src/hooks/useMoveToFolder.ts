import { useState } from 'react';
import type { Folder } from '@lib/types';

interface UseMoveToFolderOptions {
  folders: Folder[];
  onMove: (folderId: string | undefined) => void;
  onCreateFolder?: () => void;
}

interface UseMoveToFolderReturn {
  isModalOpen: boolean;
  currentFolderId: string | undefined;
  openModal: (currentFolderId?: string) => void;
  closeModal: () => void;
  handleMove: (folderId: string | undefined) => void;
  isEmptyState: boolean;
}

export function useMoveToFolder({
  folders,
  onMove,
  onCreateFolder: _onCreateFolder,
}: UseMoveToFolderOptions): UseMoveToFolderReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);

  const openModal = (folderId?: string) => {
    setCurrentFolderId(folderId);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleMove = (folderId: string | undefined) => {
    onMove(folderId);
    closeModal();
  };

  const isEmptyState = folders.length === 0;

  return {
    isModalOpen,
    currentFolderId,
    openModal,
    closeModal,
    handleMove,
    isEmptyState,
  };
}
