"use client";

import RoleGuard from '@/components/RoleGuard';

export default function RoleRoutePage({ allowedRoles, title, subtitle, badgeText, children }) {
  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
            {badgeText || (allowedRoles.includes('owner') ? 'Admin / Owner' : 'Staff')}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </RoleGuard>
  );
}
