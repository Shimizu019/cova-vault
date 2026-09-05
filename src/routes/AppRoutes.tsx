import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@layout/AppShell';
import { Dashboard } from '@pages/Dashboard';
import { Credentials } from '@pages/Credentials';
import { Generator } from '@pages/Generator';
import { Settings } from '@pages/Settings';
import { Notes } from '@pages/Notes';
import { Tasks } from '@pages/Tasks';
import { Favorites } from '@pages/Favorites';
import { Folders } from '@pages/Folders';
import { Calendar } from '@pages/Calendar';
import { Schedule } from '@pages/Schedule';
import { Activity } from '@pages/Activity';
import { Wallet } from '@pages/Wallet';
import { Savings } from '@pages/Savings';
import { Lock } from '@pages/Lock';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/lock" element={<Lock />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/" element={<Navigate to="/lock" replace />} />
        <Route path="*" element={<Navigate to="/lock" replace />} />
      </Route>
    </Routes>
  );
}