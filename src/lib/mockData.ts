import type {
  Credential, Note, Task, WalletRecord,
  ActivityItem, Folder, User, AppSettings,
} from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Reyes',
  displayName: 'Alex Reyes',
  email: 'alex.reyes@cova.app',
  avatarInitial: 'AR',
  createdAt: '2024-01-15T10:00:00Z',
};

export const mockFolders: Folder[] = [
  { id: 'folder-work', name: 'Work', type: 'credentials', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'folder-personal', name: 'Personal', type: 'mixed', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'folder-finance', name: 'Finance', type: 'mixed', createdAt: '2024-01-15T10:00:00Z' },
];

export const mockCredentials: Credential[] = [
  { id: 'cred-1', name: 'Google Workspace', username: 'alex.reyes@company.com',
    password: 'G00gl3Secur3P@ss2024', website: 'workspace.google.com',
    folderId: 'folder-work', tags: ['work', 'email'], favorite: true,
    createdAt: '2024-01-20T09:30:00Z', updatedAt: '2024-03-15T14:22:00Z' },
  { id: 'cred-2', name: 'Microsoft 365', username: 'alex.reyes@company.com',
    password: 'M1cr0s0ft@Azure2024', website: 'portal.office.com',
    folderId: 'folder-work', tags: ['work'], favorite: true,
    createdAt: '2024-01-22T11:00:00Z', updatedAt: '2024-03-10T10:00:00Z' },
  { id: 'cred-3', name: 'GitHub', username: 'alexreyes-dev',
    password: 'G1tHubS3cur3Key2024', website: 'github.com',
    folderId: 'folder-work', tags: ['work', 'dev'], favorite: true,
    createdAt: '2024-01-25T14:00:00Z', updatedAt: '2024-02-28T16:45:00Z' },
  { id: 'cred-4', name: 'AWS Console', username: 'alex.reyes@company.com',
    password: 'AwSS3cr3tK3y2024Prod', website: 'console.aws.amazon.com',
    folderId: 'folder-work', tags: ['work', 'cloud'], favorite: false,
    createdAt: '2024-02-01T10:00:00Z', updatedAt: '2024-03-05T12:00:00Z' },
  { id: 'cred-5', name: 'GCash', username: '+639171234567',
    password: 'GcshS3cur3Pin2024', website: 'gcash.com',
    folderId: 'folder-finance', tags: ['finance', 'ph'], favorite: true,
    createdAt: '2024-02-05T10:00:00Z', updatedAt: '2024-03-12T10:00:00Z' },
  { id: 'cred-6', name: 'BPI Online', username: 'alexreyes123',
    password: 'Bp1S3cur3Banking2024', website: 'bpi.com.ph',
    folderId: 'folder-finance', tags: ['finance', 'ph', 'bank'], favorite: false,
    createdAt: '2024-02-08T10:00:00Z', updatedAt: '2024-03-01T10:00:00Z' },
  { id: 'cred-7', name: 'Netflix', username: 'alex.reyes@home.com',
    password: 'N3tfl1xS3cur3Stream2024', website: 'netflix.com',
    folderId: 'folder-personal', tags: ['personal', 'streaming'], favorite: false,
    createdAt: '2024-02-12T10:00:00Z', updatedAt: '2024-02-12T10:00:00Z' },
  { id: 'cred-8', name: 'Figma', username: 'alex.reyes@design.com',
    password: 'F1gmD3sgnP@ss2024', website: 'figma.com',
    folderId: 'folder-work', tags: ['work', 'design'], favorite: false,
    createdAt: '2024-02-15T13:00:00Z', updatedAt: '2024-03-01T10:00:00Z' },
];

export const mockNotes: Note[] = [
  { id: 'note-1', title: 'Project Roadmap', content: 'Q2 milestones for the Cova redesign.',
    favorite: true, createdAt: '2024-03-10T10:00:00Z', updatedAt: '2024-03-18T10:00:00Z' },
  { id: 'note-2', title: 'Meeting Notes March 15', content: 'Discussed vault security improvements.',
    favorite: false, createdAt: '2024-03-15T14:00:00Z', updatedAt: '2024-03-15T14:00:00Z' },
  { id: 'note-3', title: 'API Keys Reference', content: 'Personal API tokens for development tools.',
    favorite: true, createdAt: '2024-02-20T10:00:00Z', updatedAt: '2024-03-12T10:00:00Z' },
];

export const mockTasks: Task[] = [
  { id: 'task-1', title: 'Review security audit report',
    description: 'Go through the recent Cova security audit findings.',
    dueDate: '2024-03-25', priority: 'high', status: 'in_progress',
    createdAt: '2024-03-15T10:00:00Z', updatedAt: '2024-03-20T10:00:00Z' },
  { id: 'task-2', title: 'Update family passwords',
    description: 'Rotate shared streaming and utility passwords.',
    dueDate: '2024-03-30', priority: 'medium', status: 'todo',
    createdAt: '2024-03-18T10:00:00Z', updatedAt: '2024-03-18T10:00:00Z' },
  { id: 'task-3', title: 'Enable 2FA on BPI', priority: 'high', status: 'todo',
    createdAt: '2024-03-19T10:00:00Z', updatedAt: '2024-03-19T10:00:00Z' },
];

export const mockWalletRecords: WalletRecord[] = [
  { id: 'wallet-1', date: '2024-03-20', description: 'Monthly Salary', category: 'Salary',
    amount: 65000, type: 'income', createdAt: '2024-03-20T10:00:00Z' },
  { id: 'wallet-2', date: '2024-03-18', description: 'Freelance Project', category: 'Freelance',
    amount: 12500, type: 'income', createdAt: '2024-03-18T14:00:00Z' },
  { id: 'wallet-3', date: '2024-03-19', description: 'Groceries SM Supermarket', category: 'Food',
    amount: 2450.75, type: 'expense', createdAt: '2024-03-19T11:00:00Z' },
  { id: 'wallet-4', date: '2024-03-15', description: 'Internet and Utilities', category: 'Utilities',
    amount: 2156.78, type: 'expense', createdAt: '2024-03-15T10:00:00Z' },
  { id: 'wallet-5', date: '2024-03-10', description: 'Coffee and Snacks', category: 'Food',
    amount: 580, type: 'expense', createdAt: '2024-03-10T15:00:00Z' },
];

export const mockActivities: ActivityItem[] = [
  { id: 'act-1', type: 'credentials', title: 'Created credential', detail: 'Google Workspace', timestamp: '2024-03-20T08:15:00Z' },
  { id: 'act-2', type: 'tasks', title: 'Task started', detail: 'Review security audit report', timestamp: '2024-03-19T14:30:00Z' },
  { id: 'act-3', type: 'wallet', title: 'Income recorded', detail: 'Monthly Salary PHP 65000', timestamp: '2024-03-20T10:00:00Z' },
  { id: 'act-4', type: 'credentials', title: 'Favorited credential', detail: 'AWS Console', timestamp: '2024-03-18T16:00:00Z' },
  { id: 'act-5', type: 'notes', title: 'Note updated', detail: 'Project Roadmap', timestamp: '2024-03-18T11:00:00Z' },
  { id: 'act-6', type: 'tasks', title: 'Task completed', detail: 'Setup biometric login', timestamp: '2024-03-17T09:00:00Z' },
  { id: 'act-7', type: 'wallet', title: 'Expense recorded', detail: 'Groceries PHP 2450', timestamp: '2024-03-19T11:00:00Z' },
];

export const defaultSettings: AppSettings = {
  theme: 'dark',
  accentColor: 'violet',
  fontSize: 'medium',
  layoutDensity: 'comfortable',
  language: 'en',
  notifications: true,
  twoFactorEnabled: false,
  backupEnabled: false,
  autoLock: false,
  showPasswords: false,
};
