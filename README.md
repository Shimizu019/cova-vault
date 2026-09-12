# <div align="center"><img src="src/assets/image/CovaLogo.png" alt="Cova Vault" height="80" /></div>

![Status](https://img.shields.io/badge/status-ongoing-success)
![Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20Vite%208%20%7C%20TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-green)

> Your secure personal vault — a self-hosted, browser-based companion for managing
> credentials, notes, tasks, finances, savings goals, and more in one place.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Core Modules](#core-modules)
  - [Cross-cutting](#cross-cutting)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Develop](#develop)
  - [Build](#build)
  - [Preview](#preview)
  - [Lint](#lint)
- [Architecture Notes](#architecture-notes)
  - [State Management](#state-management)
  - [Activity Log](#activity-log)
  - [Folder / Item Relationship](#folder--item-relationship)
  - [PeraLog (Wallet)](#peralog-wallet)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

**Cova Vault** is a modular personal vault application built with React 19, TypeScript, and Vite. It bundles
the tools most people need day-to-day — password storage, notes, tasks, finance tracking, savings goals,
favorites, and a unified activity log — into a single, fast, and responsive interface.

Data is persisted client-side (via `zustand/persist` to `localStorage`), so the app runs entirely in
your browser with no backend required. Swap the persistence layer for any storage backend of your
choice and you have a fully self-hosted vault.

## Features

### Core Modules

| Module | Description |
| ------ | ----------- |
| **Dashboard** | Overview of credentials, notes, tasks, wallet, and savings with a unified activity feed |
| **Credentials** | Secure password storage with username, password, website, tags, favorite toggle, password strength meter, and password generator |
| **PeraLog** | Personal finance tracker: income/expense records, monthly summary, category breakdown, budgets, and balance card |
| **Savings** | Savings goals and progress tracking with persistence across navigation |
| **Notes** | Quick notes with favorites, search, and folder organization |
| **Tasks** | To-dos with status tracking, calendar/schedule integration, and folders |
| **Folders** | Organize credentials, notes, and tasks into persistent, navigable folders |
| **Favorites** | Quick access to your starred credentials and items |
| **Calendar & Schedule** | Date-based view of tasks and due items |
| **Password Generator** | Strong random password generator |
| **Activity Log** | Chronological feed of every action taken across all modules |

### Cross-cutting

- **Persistent storage** — all data survives navigation, refresh, and browser close (via `localStorage`)
- **Single source of truth** — every module reads from and writes to its own `zustand` store
- **Centralized activity logging** — creates, updates, deletes, moves, toggles, and folder operations all log to a unified `useActivityStore` consumed by the Dashboard and Activity page
- **Responsive layout** — collapsible sidebar on desktop; slide-in drawer on mobile
- **Mobile-first** — bottom-sheet modals, adaptive per-page padding, safe-area inset for notched phones, and per-page responsive tweaks
- **Light/dark theming** — `tailwindcss` with custom `cova-*` design tokens
- **Accessible** — ARIA labels, semantic landmarks, keyboard-navigable controls, focus management, and reduced-motion-friendly animations

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| State | Zustand 5 (with `persist` middleware) |
| Styling | Tailwind CSS 3 + custom CSS variables |
| Icons | Lucide React |
| Linting | Oxlint |

## Project Structure

```text
cova-vault/
+-- index.html                 # App entry HTML
+-- package.json
+-- vite.config.ts
+-- tailwind.config.js
+-- tsconfig*.json
+-- src/
    +-- main.tsx               # App bootstrap
    +-- App.tsx                # Root component
    +-- index.css              # Global styles + tailwind layers
    +-- assets/image/          # Logos and static images
    |   +-- CovaLogo.png
    |   +-- lockLogo.png
    +-- components/
    |   +-- layout/            # AppShell, PrimarySidebar, SecondarySidebar
    |   +-- ui/                # Reusable UI primitives (Button, Modal, Input, etc.)
    |   +-- features/          # Feature-specific components (credentials, settings, etc.)
    +-- pages/                 # Route-level components (Dashboard, Credentials, Wallet, ...)
    +-- routes/                # AppRoutes - the route tree
    +-- lib/
        +-- types.ts           # Shared TypeScript interfaces
        +-- utils.ts           # Helpers (cn, generateId, password strength, etc.)
        +-- store/             # Zustand stores (credential, note, task, wallet, savings, activity, settings, ui)
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

### State Management

Each domain has its own Zustand store under `src/lib/store/`:

- `useCredentialStore` — credentials, folders
- `useNoteStore` — notes, folders
- `useTaskStore` — tasks, folders
- `useWalletStore` — wallet records, budgets
- `useSavingsStore` — savings goals
- `useActivityStore` — centralized activity log
- `useSettingsStore` — user profile, app settings
- `useUIStore` — UI-only state (sidebar collapsed, toasts, search query, password visibility)

Stores are wrapped with `zustand/middleware/persist` and write to `localStorage` under names like
`cova-credential-store`. Replace the persistence layer (or back it with `IndexedDB`, a remote API,
etc.) to fit your deployment.

### Activity Log

`useActivityStore` is the single source of truth for activity tracking. Every module dispatches
`addActivity(...)` on meaningful actions (create/update/delete/toggle/move/rename). The Dashboard
and Activity page consume this centralized list to render the recent activity widget.

### Folder / Item Relationship

`Folder.folderId` links items to folders across Credentials, Notes, and Tasks. The stores expose:

- `useCredentialStore`: `addFolder`, `renameFolder`, `deleteFolder`, `moveCredentialToFolder(id, folderId | undefined)`, `getCredentialsByFolder`, `getFolderCount`, `getFolderById`
- `useNoteStore`: `addFolder`, `renameFolder`, `deleteFolder`, `moveNoteToFolder(id, folderId | undefined)`
- `useTaskStore`: `addFolder`, `renameFolder`, `deleteFolder`, `moveTaskToFolder(id, folderId | undefined)`

Folders can be module-specific (`type: 'credentials' | 'notes' | 'tasks'`) or `mixed`. Deleting a folder does not delete the items inside; instead, their `folderId` is set to `undefined` and they appear under **No Folder**.

### PeraLog (Wallet)

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

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Serve the production build locally |

## License

MIT - see [LICENSE](./LICENSE).