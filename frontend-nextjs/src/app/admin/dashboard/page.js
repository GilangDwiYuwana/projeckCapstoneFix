import RoleRoutePage from '@/components/RoleRoutePage';
import DashboardContent from '@/components/DashboardContent';

export default function AdminDashboardPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Dashboard Admin"
      subtitle="Pantau performa bisnis, target penjualan, dan laporan operasional dari satu tempat."
      badgeText="Admin / Owner"
    >
      <DashboardContent />
    </RoleRoutePage>
  );
}
