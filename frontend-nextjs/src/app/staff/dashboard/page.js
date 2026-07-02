import RoleRoutePage from '@/components/RoleRoutePage';
import DashboardContent from '@/components/DashboardContent';

export default function StaffDashboardPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Dashboard Staff"
      subtitle="Lihat target penjualan, progress pencapaian, dan tugas harian yang perlu diselesaikan."
      badgeText="Staff"
    >
      <DashboardContent />
    </RoleRoutePage>
  );
}
