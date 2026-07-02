import RoleRoutePage from '@/components/RoleRoutePage';
import TrainingPage from '@/app/training/page';

export default function StaffTrainingPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Training Model"
      subtitle="Pantau status model prediksi dan hasil pelatihan yang relevan dengan tugas staff."
      badgeText="Staff"
    >
      <TrainingPage />
    </RoleRoutePage>
  );
}
