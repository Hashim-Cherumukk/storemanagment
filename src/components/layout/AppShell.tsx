import React from 'react';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { getCurrentUser } from '@/lib/actions/auth-actions';

interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUser();

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F7F6F2]">
        <Sidebar user={user} />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
