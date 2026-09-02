import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@layout/AppShell';
import { Dashboard } from '@pages/Dashboard';
import { Credentials } from '@pages/Credentials';
import { Generator } from '@pages/Generator';
import { Settings } from '@pages/Settings';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/lock" element={<div className="flex items-center justify-center h-full"><p className="text-cova-text">Vault Locked — Lock functionality coming soon</p></div>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}