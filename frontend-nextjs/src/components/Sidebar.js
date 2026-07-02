"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Database, Package, Upload, Brain, TrendingUp, Megaphone, Zap, LogOut, LayoutDashboard, Target, FileSpreadsheet, Users2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const basePath = user?.role === 'staff' ? '/staff' : user?.role === 'owner' ? '/admin' : '';

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: basePath ? `${basePath}/dashboard` : '/dashboard' },
    { name: 'Master Data', icon: Database, path: basePath ? `${basePath}/masterdata` : '/masterdata' },
    { name: 'Stock Barang', icon: Package, path: basePath ? `${basePath}/stockbarang` : '/stockbarang' },
    { name: 'Impor Dataset', icon: Upload, path: basePath ? `${basePath}/importdataset` : '/importdataset' },
  ];

  const analyticsItems = [
    { name: 'Training Model', icon: Brain, path: basePath ? `${basePath}/training` : '/training' },
    { name: 'Prediksi', icon: TrendingUp, path: basePath ? `${basePath}/prediksi` : '/prediksi' },
    { name: 'Rekomendasi', icon: Megaphone, path: basePath ? `${basePath}/rekomendasi` : '/promosi' },
  ];

  const ownerItems = [
    { name: 'Target', icon: Target, path: '/owner/target' },
    { name: 'Promosi', icon: Megaphone, path: '/owner/promosi' },
    { name: 'Laporan', icon: FileSpreadsheet, path: '/owner/laporan' },
    { name: 'Staff', icon: Users2, path: '/owner/staff' },
  ];

  const NavLink = ({ item }) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

    return (
      <Link
        href={item.path}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? 'border-l-4 border-red-600 bg-red-50 text-red-600 shadow-sm'
            : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
        }`}
      >
        <item.icon className="h-4.5 w-4.5" />
        {item.name}
      </Link>
    );
  };

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-600/20">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">XGBOOST ENGINE</h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">Honda Prediction</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Main Menu</p>
        {menuItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}

        <p className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Analytics</p>
        {analyticsItems.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}

        {user?.role === 'owner' ? (
          <>
            <p className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Owner</p>
            {ownerItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-red-600 to-red-800 text-sm font-bold text-white">
          {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Admin XGBoost'}</p>
          <p className="text-[11px] text-slate-400">{user?.role === 'owner' ? 'Owner' : user?.role === 'staff' ? 'Staff' : 'Guest'}</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}