import RoleRoutePage from '@/components/RoleRoutePage';
import Prediksi from '@/app/prediksi/page';

export default function StaffPrediksiPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Prediksi Penjualan"
      subtitle="Pantau hasil prediksi penjualan sebagai referensi dalam kegiatan harian."
      badgeText="Staff"
    >
      <Prediksi />
    </RoleRoutePage>
  );
}
