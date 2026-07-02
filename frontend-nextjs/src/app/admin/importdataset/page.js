import RoleRoutePage from '@/components/RoleRoutePage';
import ImporPage from '@/app/impor/page';

export default function AdminImportDatasetPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Impor Dataset"
      subtitle="Unggah dataset untuk kebutuhan pelatihan dan analitik admin."
      badgeText="Admin / Owner"
    >
      <ImporPage />
    </RoleRoutePage>
  );
}
