"use client";

import RoleGuard from '@/components/RoleGuard';
import DashboardContent from '@/components/DashboardContent';

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={['owner', 'staff']}>
      <DashboardContent />
    </RoleGuard>
  );
}
