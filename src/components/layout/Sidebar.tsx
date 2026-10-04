'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  FolderTree,
  FileBarChart,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { Profile } from '@/types/database';
import { logoutAction } from '@/lib/actions/auth-actions';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface SidebarProps {
  user: Profile | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const mainNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Boxes,
      active: pathname.startsWith('/inventory'),
    },
    {
      name: 'Issued Items',
      href: '/issues',
      icon: ArrowUpRight,
      active: pathname.startsWith('/issues'),
    },
    {
      name: 'Returns',
      href: '/returns',
      icon: ArrowDownLeft,
      active: pathname.startsWith('/returns'),
    },
    {
      name: 'People',
      href: '/people',
      icon: Users,
      active: pathname.startsWith('/people'),
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: FolderTree,
      active: pathname.startsWith('/categories'),
    },
  ];

  const secondaryNavItems = [
    {
      name: 'Reports',
      href: '/reports',
      icon: FileBarChart,
      active: pathname === '/reports',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/analytics'),
    },
    {
      name: 'Activity History',
      href: '/audit',
      icon: ShieldCheck,
      active: pathname.startsWith('/audit'),
    },
  ];

  const settingsNavItem = {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    active: pathname.startsWith('/settings'),
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'SK';

  const handleSignoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignoutConfirm(true);
  };

  const confirmSignout = async () => {
    setIsSigningOut(true);
    await logoutAction();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] text-[#202326] border-r border-[#E3E5E7]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E3E5E7]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#F1F3F2] border border-[#E3E5E7] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-[#34495E]" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold tracking-wide text-[#697077] uppercase leading-none mb-0.5">
              Institution
            </span>
            <span className="block text-sm font-semibold text-[#202326] leading-none">
              Central Store
            </span>
          </div>
        </div>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-[#697077] hover:text-[#202326] p-1 rounded"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-[#878D96] uppercase px-2 mb-1.5">
            Store Operations
          </span>
          <nav className="space-y-0.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    item.active
                      ? 'bg-[#EEF0F1] text-[#202326] font-semibold border-l-2 border-[#34495E]'
                      : 'text-[#697077] hover:bg-[#F1F3F2] hover:text-[#202326]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.active ? 'text-[#34495E]' : 'text-[#878D96]'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Intelligence / Reports Section */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-[#878D96] uppercase px-2 mb-1.5">
            Reports & History
          </span>
          <nav className="space-y-0.5">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                    item.active
                      ? 'bg-[#EEF0F1] text-[#202326] font-semibold border-l-2 border-[#34495E]'
                      : 'text-[#697077] hover:bg-[#F1F3F2] hover:text-[#202326]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      item.active ? 'text-[#34495E]' : 'text-[#878D96]'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Separator */}
        <div className="border-t border-[#E3E5E7]" />

        {/* Settings */}
        <div>
          <nav>
            <Link
              href={settingsNavItem.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                settingsNavItem.active
                  ? 'bg-[#EEF0F1] text-[#202326] font-semibold border-l-2 border-[#34495E]'
                  : 'text-[#697077] hover:bg-[#F1F3F2] hover:text-[#202326]'
              }`}
            >
              <Settings
                className={`w-4 h-4 shrink-0 ${
                  settingsNavItem.active ? 'text-[#34495E]' : 'text-[#878D96]'
                }`}
              />
              <span>{settingsNavItem.name}</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#E3E5E7] bg-[#F6F6F3]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#34495E] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="overflow-hidden leading-tight">
              <span className="block text-xs font-semibold text-[#202326] truncate">
                {user?.full_name || 'Storekeeper'}
              </span>
              <span className="block text-[11px] text-[#697077] font-medium truncate">
                {user?.role === 'STOREKEEPER' ? 'Head Storekeeper' : user?.role || 'Storekeeper'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignoutClick}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#8C1D18] hover:text-[#B3261E] bg-[#FDF2F2] hover:bg-[#FCE8E6] border border-[#F8C4C1] rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#FFFFFF] text-[#202326] border-b border-[#E3E5E7]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#F1F3F2] border border-[#E3E5E7] flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-[#34495E]" />
          </div>
          <span className="font-semibold text-sm">Institutional Store</span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 text-[#697077] hover:text-[#202326] rounded"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 flex"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-64 max-w-[80vw] h-full shadow-lg">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Sign Out Confirmation Modal */}
      <ConfirmDialog
        isOpen={showSignoutConfirm}
        onClose={() => setShowSignoutConfirm(false)}
        onConfirm={confirmSignout}
        title="Sign Out of Institutional Store?"
        description={`Are you sure you want to sign out, ${user?.full_name || 'Storekeeper'}? Active inventory sessions will be closed securely.`}
        confirmLabel="Yes, Sign Out"
        cancelLabel="Stay Signed In"
        variant="danger"
        isLoading={isSigningOut}
      />
    </>
  );
}
