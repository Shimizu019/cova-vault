import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Credential, Note, Task, IncomeRecord, Folder, Settings, User } from '@lib/types';
import { mockCredentials, mockNotes, mockTasks, mockIncomeRecords, mockFolders, mockUser, defaultSettings } from '@lib/mockData';
import { generateId, formatDate } from '@lib/utils';

interface DataContextType {
  // User
  user: User;
  
  // Credentials
  credentials: Credential[];
  addCredential: (cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Credential;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  toggleFavoriteCredential: (id: string) => void;
  
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  
  // Income
  incomeRecords: IncomeRecord[];
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>) => IncomeRecord;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => void;
  deleteIncomeRecord: (id: string) => void;
  
  // Folders
  folders: Folder[];
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Folder;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  
  // Settings
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  
  // Lock
  isLocked: boolean;
  lock: () => void;
  unlock: (password: string) => boolean;
  setMasterPassword: (password: string) => void;
  hasMasterPassword: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  credentials: 'cova_credentials',
  notes: 'cova_notes',
  tasks: 'cova_tasks',
  incomeRecords: 'cova_income',
  folders: 'cova_folders',
  settings: 'cova_settings',
  masterPassword: 'cova_master_password',
  locked: 'cova_locked',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User>(mockUser);
  
  const [credentials, setCredentials] = useState<Credential[]>(() => 
    loadFromStorage(STORAGE_KEYS.credentials, mockCredentials)
  );
  const [notes, setNotes] = useState<Note[]>(() => 
    loadFromStorage(STORAGE_KEYS.notes, mockNotes)
  );
  const [tasks, setTasks] = useState<Task[]>(() => 
    loadFromStorage(STORAGE_KEYS.tasks, mockTasks)
  );
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(() => 
    loadFromStorage(STORAGE_KEYS.incomeRecords, mockIncomeRecords)
  );
  const [folders, setFolders] = useState<Folder[]>(() => 
    loadFromStorage(STORAGE_KEYS.folders, mockFolders)
  );
  const [settings, setSettings] = useState<Settings>(() => 
    loadFromStorage(STORAGE_KEYS.settings, defaultSettings)
  );
  
  const [isLocked, setIsLocked] = useState(() => 
    loadFromStorage(STORAGE_KEYS.locked, false)
  );
  const [masterPassword, setMasterPasswordState] = useState(() => 
    loadFromStorage(STORAGE_KEYS.masterPassword, '')
  );

  // Persist to localStorage
  useEffect(() => saveToStorage(STORAGE_KEYS.credentials, credentials), [credentials]);
  useEffect(() => saveToStorage(STORAGE_KEYS.notes, notes), [notes]);
  useEffect(() => saveToStorage(STORAGE_KEYS.tasks, tasks), [tasks]);
  useEffect(() => saveToStorage(STORAGE_KEYS.incomeRecords, incomeRecords), [incomeRecords]);
  useEffect(() => saveToStorage(STORAGE_KEYS.folders, folders), [folders]);
  useEffect(() => saveToStorage(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveToStorage(STORAGE_KEYS.locked, isLocked), [isLocked]);
  useEffect(() => saveToStorage(STORAGE_KEYS.masterPassword, masterPassword), [masterPassword]);

  const now = () => new Date().toISOString();

  // Credentials
  const addCredential = useCallback((cred: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCred: Credential = {
      ...cred,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setCredentials(prev => [newCred, ...prev]);
    return newCred;
  }, []);

  const updateCredential = useCallback((id: string, updates: Partial<Credential>) => {
    setCredentials(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: now() } : c
    ));
  }, []);

  const deleteCredential = useCallback((id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleFavoriteCredential = useCallback((id: string) => {
    setCredentials(prev => prev.map(c => 
      c.id === id ? { ...c, favorite: !c.favorite, updatedAt: now() } : c
    ));
  }, []);

  // Notes
  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...note,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: now() } : n
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const toggleFavoriteNote = useCallback((id: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, favorite: !n.favorite, updatedAt: now() } : n
    ));
  }, []);

  // Tasks
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates, updatedAt: now() } : t
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const statuses: Task['status'][] = ['todo', 'in_progress', 'done'];
      const currentIndex = statuses.indexOf(t.status);
      const nextIndex = (currentIndex + 1) % statuses.length;
      return { ...t, status: statuses[nextIndex], updatedAt: now() };
    }));
  }, []);

  // Income
  const addIncomeRecord = useCallback((record: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord: IncomeRecord = {
      ...record,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setIncomeRecords(prev => [newRecord, ...prev]);
    return newRecord;
  }, []);

  const updateIncomeRecord = useCallback((id: string, updates: Partial<IncomeRecord>) => {
    setIncomeRecords(prev => prev.map(r => 
      r.id === id ? { ...r, ...updates, updatedAt: now() } : r
    ));
  }, []);

  const deleteIncomeRecord = useCallback((id: string) => {
    setIncomeRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  // Folders
  const addFolder = useCallback((folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFolder: Folder = {
      ...folder,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  }, []);

  const updateFolder = useCallback((id: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates, updatedAt: now() } : f
    ));
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Also remove folder reference from items
    setCredentials(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined, updatedAt: now() } : c));
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: undefined, updatedAt: now() } : n));
  }, []);

  // Settings
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Lock
  const lock = useCallback(() => setIsLocked(true), []);
  
  const unlock = useCallback((password: string) => {
    if (masterPassword && password === masterPassword) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [masterPassword]);

  const setMasterPassword = useCallback((password: string) => {
    setMasterPasswordState(password);
  }, []);

  const hasMasterPassword = !!masterPassword;

  return (
    <DataContext.Provider value={{
      user,
      credentials,
      addCredential,
      updateCredential,
      deleteCredential,
      toggleFavoriteCredential,
      notes,
      addNote,
      updateNote,
      deleteNote,
      toggleFavoriteNote,
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      incomeRecords,
      addIncomeRecord,
      updateIncomeRecord,
      deleteIncomeRecord,
      folders,
      addFolder,
      updateFolder,
      deleteFolder,
      settings,
      updateSettings,
      isLocked,
      lock,
      unlock,
      setMasterPassword,
      hasMasterPassword,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}