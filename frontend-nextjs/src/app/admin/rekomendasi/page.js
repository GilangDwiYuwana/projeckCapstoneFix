import RoleRoutePage from '@/components/RoleRoutePage';
import PromosiPage from '@/app/promosi/page';

export default function AdminRekomendasiPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Rekomendasi Promosi"
      subtitle="Lihat dan kelola strategi promosi yang disarankan oleh sistem AI."
      badgeText="Admin / Owner"
    >
      <PromosiPage />
    </RoleRoutePage>
  );
}
