import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useState, ReactNode } from 'react';
import { cn } from '@lib/utils';
import { Minimize, Maximize, X } from 'lucide-react';

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [searchValue, setSearchValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-bg dark:bg-dark-bg relative">
      <div className="fixed inset-0 bg-dark-bg dark:bg-dark-bg z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-dark-bg to-dark-bg opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dark-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dark-success/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="desktop-window w-full max-w-[1400px] h-[calc(100vh-2rem)] max-h-[900px] rounded-xl overflow-hidden shadow-window-dark bg-dark-surface dark:bg-dark-surface border border-dark-border">
          <div className="title-bar h-10 bg-dark-bg dark:bg-dark-bg border-b border-dark-border flex items-center justify-between px-3 -z-10">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <button className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" aria-label="Close" />
                <button className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" aria-label="Minimize" />
                <button className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" aria-label="Maximize" />
              </div>
              <span className="text-xs text-dark-textMuted ml-2 font-medium">Keepr</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-dark-textMuted">v1.0.0</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            
            <div className="flex-1 flex flex-col min-w-0 bg-dark-surface dark:bg-dark-surface">
              <Topbar onSearch={setSearchValue} searchValue={searchValue} />
              
              <main className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="max-w-7xl mx-auto w-full">
                  {children || <Outlet />}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}