# Cova

> Your secure password manager and personal vault - a self-hosted, browser-based companion for managing
> credentials, notes, tasks, finances, and more in one place.

![Status](https://img.shields.io/badge/status-active-success)
![Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20Vite%208%20%7C%20TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Overview

**Cova** is a modular personal vault application built with React 19, TypeScript, and Vite. It bundles
the tools most people need day-to-day - password storage, notes, tasks, finance tracking, savings goals,
favorites, and an activity log - into a single, fast, and responsive interface.

Data is persisted client-side (via `zustand/persist` to `localStorage`), so the app runs entirely in
your browser with no backend required. Swap the persistence layer for any storage backend of your
choice and you have a fully self-hosted vault.

## Features

### Core Modules
- **Dashboard** - overview of credentials, notes, tasks, and wallet activity with a unified activity
  feed
- **Credentials** - secure password storage with username, password, website, tags, favorite toggle,
  password strength meter, and password generator
- **PeraLog (My Wallet)** - personal finance tracker: income/expense records, monthly summary,
  category breakdown, budgets, and balance card
- **Savings** - savings goals and progress tracking
- **Notes** - quick notes with tagging
- **Tasks** - to-dos with completion status
- **Folders** - organize credentials into persistent, navigable folders
- **Favorites** - quick access to your starred credentials and items
- **Calendar & Schedule** - date-based view of items and tasks
- **Password Generator** - strong random password generator
- **Activity Log** - chronological feed of every action taken across all modules

### Cross-cutting
- **Persistent storage** - all data survives navigation, refresh, and browser close (via
  `localStorage` by default)
- **Single source of truth** - every module reads from and writes to its own `zustand` store
- **Activity tracking** - creates, updates, deletes, moves, toggles, and folder operations all log to
  the unified Activity feed
- **Responsive layout** - collapsible sidebar on desktop; slide-in drawer on mobile
- **Mobile-first** - bottom-sheet modals, adaptive per-page padding, safe-area inset for notched
  phones, and per-page responsive tweaks (e.g. calendar grid collapses to dot indicators on small
  screens)
- **Light/dark theming** - `tailwindcss` with custom `cova-*` design tokens
- **Accessible** - ARIA labels, semantic landmarks, keyboard-navigable controls, focus management,
  and reduced-motion-friendly animations

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Framework    | React 19                                   |
| Language     | TypeScript                                 |
| Build tool   | Vite 8                                     |
| Routing      | React Router 7                             |
| State        | Zustand 5 (with `persist` middleware)      |
| Styling      | Tailwind CSS 3 + custom CSS variables      |
| Icons        | Lucide React                               |
| Linting      | Oxlint                                     |

## Project Structure

```
cova-vault/
+-- index.html                 # App entry HTML (title: "Cova")
+-- package.json
+-- vite.config.ts
+-- tailwind.config.js
+-- tsconfig*.json
+-- src/
    +-- main.tsx               # App bootstrap
    +-- App.tsx                # Root component
    +-- index.css              # Global styles + tailwind layers
    +-- assets/image/          # Logos and static images
    -   +-- CovaLogo.png
    -   +-- lockLogo.png
    +-- components/
    -   +-- layout/            # AppShell, PrimarySidebar, SecondarySidebar
    -   +-- ui/                # Reusable UI primitives (Button, Modal, Input, etc.)
    -   +-- features/          # Feature-specific components (credentials, settings, etc.)
    +-- pages/                 # Route-level components (Dashboard, Credentials, Wallet, Folders, ...)
    +-- routes/                # AppRoutes - the route tree
    +-- lib/
        +-- types.ts           # Shared TypeScript interfaces
        +-- utils.ts           # Helpers (cn, generateId, password strength, etc.)
        +-- mockData.ts        # Seed data for development
        +-- store/             # Zustand stores (credential, note, task, wallet, settings, ui)
```

## Getting Started

### Prerequisites

- **Node.js** 20+ (Vite 8 requires a modern Node)
- **npm** 10+ (or `pnpm` / `yarn`)

### Install

```bash
npm install
```

### Develop

```bash
npm run dev
```

Opens a Vite dev server with HMR. By default it serves on `http://localhost:5173`.

### Build

```bash
npm run build
```

Produces a production build in `dist/`. Output is `tsc -b && vite build` (type-check then bundle).

### Preview

```bash
npm run preview
```

Serves the production build locally for verification.

### Lint

```bash
npm run lint
```

Runs `oxlint` across the project.

## Architecture Notes

### State management

Each domain has its own Zustand store under `src/lib/store/`:

- `useCredentialStore` - credentials, folders, and activity feed
- `useNoteStore` - notes
- `useTaskStore` - tasks
- `useWalletStore` - wallet records, budgets
- `useSettingsStore` - user profile, app settings
- `useUIStore` - UI-only state (sidebar collapsed, toasts, search query, password visibility)

Stores are wrapped with `zustand/middleware/persist` and write to `localStorage` under names like
`cova-credential-store`. Replace the persistence layer (or back it with `IndexedDB`, a remote API,
etc.) to fit your deployment.

### Activity feed

`useCredentialStore.addActivity(...)` is called from other stores (`walletStore`, `noteStore`,
`taskStore`) to push a unified log entry on every meaningful action
(create/update/delete/toggle/move/rename). The Dashboard consumes this single list to render the
recent activity widget.

### Folder / item relationship

`Credential.folderId` is the single foreign key into the `Folder` table. The `useCredentialStore`
exposes:

- `addFolder`, `renameFolder`, `deleteFolder`
- `moveCredentialToFolder(id, folderId | undefined)`
- `getCredentialsByFolder`, `getFolderCount`, `getFolderById`

Deleting a folder moves all of its credentials to **No Folder** (`folderId` set to `undefined`);
credentials are never destroyed as a side-effect of folder deletion.

### PeraLog (wallet)

Wallet records use a small, well-defined schema:

```ts
type WalletRecord = {
  id: string;
  type: "income" | "expense";
  amount: number;          // positive number
  cashGiven?: number;      // for cash payments only
  change?: number;         // cashGiven - amount, when applicable
  category: string;
  time: string;           // ISO timestamp
  note?: string;
  updatedAt: string;
};
```

The balance is derived (sum of all records), so there is no separate balance field to keep in sync. A
"starting balance" is stored as a record with `id: "starting-balance"` and is excluded from monthly
income totals to avoid double-counting.

## Scripts

| Command         | What it does                       |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the Vite dev server          |
| `npm run build` | Type-check (`tsc -b`) and build    |
| `npm run lint`  | Run Oxlint                         |
| `npm run preview` | Serve the production build locally |

## License

MIT - see [LICENSE](./LICENSE).