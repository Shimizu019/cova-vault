// ============================================================================
// Cova Type Definitions
// ============================================================================

/** Theme mode for the application */
export type Theme = 'dark' | 'light';

/** Cova accent color choices */
export type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'pink' | 'red';

/** Font size preferences */
export type FontSize = 'small' | 'medium' | 'large';

/** Layout density */
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

/** Supported UI languages */
export type Language =
  | 'en'    // English
  | 'fil'   // Filipino / Tagalog
  | 'ko'    // Korean
  | 'zh'    // Chinese (Simplified)
  | 'ja'    // Japanese
  | 'es'    // Spanish
  | 'fr'    // French
  | 'de'    // German
  | 'vi'    // Vietnamese
  | 'id'    // Bahasa Indonesia
  | 'pt'    // Portuguese
  | 'ar';   // Arabic

/** Status type for activities and items */
export type ItemStatus = 'credentials' | 'notes' | 'tasks' | 'wallet';

// ============================================================================
// Core entities
// ============================================================================

/** Application user */
export interface User {
  id: string;
  name: string;
  displayName: string;
  email: string;
  avatarInitial: string;
  avatarUrl?: string;
  createdAt: string;
}

/** Password credential */
export interface Credential {
  id: string;
  name: string;
  username: string;
  password: string;
  website: string;
  folderId?: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Secure note */
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Task item */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

/** Budget for a spending category */
export interface Budget {
  id: string;
  category: string;
  limit: number;
  createdAt: string;
  updatedAt: string;
}

/** Wallet transaction (Philippine Peso PHP) */
export interface WalletRecord {
  id: string;
  date: string;
  time: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  cashGiven?: number;
  change?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** Recent activity entry */
export interface ActivityItem {
  id: string;
  type: ItemStatus;
  title: string;
  detail: string;
  timestamp: string;
}

/** Folder for organization */
export interface Folder {
  id: string;
  name: string;
  type: 'credentials' | 'notes' | 'tasks' | 'mixed';
  createdAt: string;
}

// ============================================================================
// Settings & navigation
// ============================================================================

export interface AppSettings {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  layoutDensity: LayoutDensity;
  language: Language;
  notifications: boolean;
  twoFactorEnabled: boolean;
  backupEnabled: boolean;
  autoLock: boolean;
  showPasswords: boolean;
}

export type NavItem = {
  id: string;
  label: string;
  iconName: IconName;
  href: string;
  group: 'module' | 'sample' | 'security';
};

/** Icon names from lucide-react used by nav */
export type IconName =
  | 'LayoutDashboard'
  | 'Key'
  | 'Wallet'
  | 'PiggyBank'
  | 'FileText'
  | 'CheckSquare'
  | 'Folder'
  | 'Star'
  | 'Calendar'
  | 'Clock'
  | 'KeyRound'
  | 'Activity'
  | 'Settings'
  | 'Lock'
  | 'Cloud'
  | 'Copy'
  | 'Eye'
  | 'MoreVertical';

// ============================================================================
// UI helper types
// ============================================================================

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  search: string;
  category?: string;
  favorite?: boolean;
  tag?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
