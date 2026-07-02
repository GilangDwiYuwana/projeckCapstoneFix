import RoleRoutePage from '@/components/RoleRoutePage';
import TrainingPage from '@/app/training/page';

export default function AdminTrainingPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Training Model"
      subtitle="Kelola model prediksi dan lihat hasil pelatihan yang digunakan untuk keputusan bisnis."
      badgeText="Admin / Owner"
    >
      <TrainingPage />
    </RoleRoutePage>
  );
}
