import RoleRoutePage from '@/components/RoleRoutePage';
import Prediksi from '@/app/prediksi/page';

export default function AdminPrediksiPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Prediksi Penjualan"
      subtitle="Lihat forecast penjualan dan gunakan insight untuk mengambil keputusan strategis."
      badgeText="Admin / Owner"
    >
      <Prediksi />
    </RoleRoutePage>
  );
}
