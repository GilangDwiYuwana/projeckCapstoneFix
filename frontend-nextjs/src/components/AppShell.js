"use client";

import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Perhatikan di bawah ini, aku menambahkan '/' agar Landing Page tidak kena Sidebar
  const isLoginPage = ['/', '/login', '/loginadmin', '/loginstaff'].includes(pathname);
  const shouldShowShell = !isLoginPage;

  if (!shouldShowShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex min-h-screen flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 py-4 backdrop-blur-lg lg:px-8">
          <h2 className="text-lg font-bold text-slate-900">Dashboard Panel</h2>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50 px-3.5 py-2 sm:flex">
              <Search className="h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search..." className="w-40 bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400" />
            </div>
            <button className="relative rounded-xl border border-slate-200/60 bg-slate-50 p-2.5 hover:bg-slate-100">
              <Bell className="h-4 w-4 text-slate-500" />
              <span className="pulse-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </>
  );
}