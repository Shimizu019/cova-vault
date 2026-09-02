import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import { DataProvider } from '@context/DataContext';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { AppShell } from '@components/AppShell';
import { LockScreen } from '@components/LockScreen';
import { Dashboard } from '@pages/Dashboard';
import { MyVault } from '@pages/MyVault';
import { Notes } from '@pages/Notes';
import { Tasks } from '@pages/Tasks';
import { Calendar } from '@pages/Calendar';
import { Income } from '@pages/Income';
import { Folders } from '@pages/Folders';
import { Favorites } from '@pages/Favorites';
import { PasswordGeneratorPage } from '@pages/PasswordGeneratorPage';
import { Activity } from '@pages/Activity';
import { Settings } from '@pages/Settings';
import { useData } from '@context/DataContext';

function ProtectedRoutes() {
  const { isLocked } = useData();
  
  if (isLocked) {
    return <LockScreen onUnlock={() => {}} />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault" element={<MyVault />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/income" element={<Income />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/password-generator" element={<PasswordGeneratorPage />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/lock" element={<LockScreen onUnlock={() => {}} />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <DataProvider>
          <BrowserRouter>
            <ProtectedRoutes />
          </BrowserRouter>
        </DataProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;