import RoleRoutePage from '@/components/RoleRoutePage';
import PromosiPage from '@/app/promosi/page';

export default function StaffRekomendasiPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Rekomendasi Promosi"
      subtitle="Lihat rekomendasi promosi yang diberikan oleh owner untuk dipakai sebagai acuan kerja."
      badgeText="Staff"
    >
      <PromosiPage />
    </RoleRoutePage>
  );
}
