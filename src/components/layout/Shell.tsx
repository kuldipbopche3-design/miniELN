'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Avatar } from '@/components/ui/Avatar';
import { 
  FlaskConical, 
  LayoutDashboard, 
  BookOpen, 
  FolderClosed, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  ChevronDown,
  Building,
  User
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/Button';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    user,
    profile, 
    activeWorkspace, 
    allWorkspaces, 
    switchWorkspace, 
    signOut, 
    isLoading 
  } = useWorkspace();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Experiment Logs', href: '/dashboard/entries', icon: BookOpen },
    { name: 'Files Explorer', href: '/dashboard/files', icon: FolderClosed },
    { name: 'Lab Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-65 text-primary animate-pulse">
            <FlaskConical className="h-7 w-7 text-primary animate-bounce" />
          </div>
          <p className="text-zinc-500 font-medium text-sm">Loading your laboratory workspace...</p>
        </div>
      </div>
    );
  }

  // Active path checker
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      
      {/* 1. Sidebar - Desktop view */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-zinc-900 border-r border-zinc-800 text-zinc-300">
        {/* Workspace Switcher Header */}
        <div className="flex h-16 items-center px-4 border-b border-zinc-800">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-2.5 w-full p-2.5 rounded-lg hover:bg-zinc-800 transition text-left focus:outline-none cursor-pointer">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-500 text-white font-semibold text-sm">
                {activeWorkspace?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{activeWorkspace?.name}</p>
                <p className="text-[10px] text-zinc-400 capitalize truncate">Active Lab Portal</p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="z-50 min-w-[220px] rounded-lg bg-zinc-900 border border-zinc-850 p-1.5 shadow-xl text-zinc-300 animate-in fade-in slide-in-from-top-1 duration-100">
                <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Switch Workspace
                </DropdownMenu.Label>
                {allWorkspaces.map((ws) => (
                  <DropdownMenu.Item
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-zinc-800 hover:text-white cursor-pointer focus:outline-none transition"
                  >
                    <Building className="h-3.5 w-3.5" />
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.id === activeWorkspace?.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </DropdownMenu.Item>
                ))}
                
                <DropdownMenu.Separator className="h-px bg-zinc-800 my-1" />
                <DropdownMenu.Item
                  onClick={() => router.push('/signup')}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md text-primary-light hover:bg-zinc-800 hover:text-white cursor-pointer focus:outline-none transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create new workspace</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
                  active 
                    ? 'bg-zinc-800 text-white shadow-xs font-semibold' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Section */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 w-full p-1">
            <Avatar name={profile?.display_name || user?.email} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.display_name || 'Lab Staff'}</p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={signOut}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Container (Includes top header bar + body) */}
      <div className="flex-1 flex flex-col md:pl-64 h-full overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-8 shadow-xs">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-zinc-250 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 md:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Logo/Identity for desktop header */}
            <div className="flex items-center gap-1.5 md:hidden">
              <FlaskConical className="h-5 w-5 text-indigo-600" />
              <span className="font-bold text-zinc-900 tracking-tight">LabFlow</span>
            </div>
            
            {/* Desktop breadcrumb identifier */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>{activeWorkspace?.name}</span>
              <span>/</span>
              <span className="text-zinc-900">
                {pathname === '/dashboard' && 'Dashboard'}
                {pathname.startsWith('/dashboard/entries') && 'Experiment Logs'}
                {pathname.startsWith('/dashboard/files') && 'Files Explorer'}
                {pathname.startsWith('/dashboard/settings') && 'Lab Settings'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick action: New Entry */}
            {pathname !== '/dashboard/entries/new' && (
              <Link href="/dashboard/entries/new">
                <Button size="sm" className="hidden sm:inline-flex shadow-xs hover:scale-[1.02] cursor-pointer">
                  <Plus className="h-4 w-4 mr-1.5" /> Log Experiment
                </Button>
              </Link>
            )}

            {/* Profile Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="focus:outline-none cursor-pointer">
                <Avatar name={profile?.display_name || user?.email} size="sm" className="hover:ring-2 hover:ring-indigo-100 transition" />
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="z-50 min-w-[180px] rounded-lg bg-white border border-zinc-200 p-1.5 shadow-xl text-zinc-700 animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="px-2.5 py-1.5 text-xs border-b border-zinc-100 pb-2">
                    <p className="font-bold text-zinc-950 truncate">{profile?.display_name || 'Lab Staff'}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenu.Item
                    onClick={() => router.push('/dashboard/settings')}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md hover:bg-zinc-50 cursor-pointer focus:outline-none transition mt-1"
                  >
                    <User className="h-3.5 w-3.5 text-zinc-400" />
                    <span>My Profile</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="h-px bg-zinc-100 my-1" />
                  <DropdownMenu.Item
                    onClick={signOut}
                    className="flex items-center gap-2 px-2.5 py-2 text-xs rounded-md text-rose-600 hover:bg-rose-50 cursor-pointer focus:outline-none transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* 3. Mobile Navigation Slider Drawer */}
      {isMobileMenuOpen && (
        <div className="relative z-50 md:hidden animate-in fade-in duration-200">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs" 
          />

          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-zinc-900 text-zinc-300 shadow-2xl p-4 space-y-6 slide-in-from-left duration-250 animate-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-6 w-6 text-indigo-500" />
                <span className="font-bold text-white text-lg">LabFlow</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Active Workspace Label */}
            <div className="p-3 bg-zinc-800/50 rounded-lg flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-500 text-white font-bold text-xs shrink-0">
                {activeWorkspace?.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white truncate">{activeWorkspace?.name}</span>
            </div>

            {/* Mobile Navigation List */}
            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      active 
                        ? 'bg-zinc-800 text-white font-semibold' 
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    <item.icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Profile & Signout footer */}
            <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar name={profile?.display_name || user?.email} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{profile?.display_name || 'Lab Staff'}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-rose-500 hover:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
