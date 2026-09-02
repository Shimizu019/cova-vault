export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'sage' | 'clay' | 'slate' | 'moss' | 'stone';
export type FontSize = 'small' | 'medium' | 'large';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  folderId?: string;
  tags?: string[];
  notes?: string;
  favorite: boolean;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  favorite: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  category?: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeRecord {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  type: 'credentials' | 'notes' | 'tasks' | 'mixed';
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  time: string;
  iconName?: string;
  color?: string;
}

export interface Settings {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  websiteIcons: boolean;
  autoLock: number;
  clipboardTimeout: number;
  showPasswords: boolean;
  confirmDelete: boolean;
  masterPassword?: string;
  recoveryEmail?: string;
  twoFactorEnabled: boolean;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  lockOnBlur: boolean;
}

export type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number | string;
  group?: 'main' | 'tools' | 'bottom';
};

export type ViewMode = 'table' | 'cards' | 'list' | 'grid';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface FilterState {
  search: string;
  category?: string;
  status?: string;
  favorite?: boolean;
  dateRange?: { start: string; end: string };
}

export interface ModalState<T = unknown> {
  isOpen: boolean;
  data?: T;
  mode: 'create' | 'edit' | 'view';
}
