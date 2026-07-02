import RoleRoutePage from '@/components/RoleRoutePage';
import ImporPage from '@/app/impor/page';

export default function StaffImportDatasetPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Impor Dataset"
      subtitle="Unggah data pendukung yang diperlukan untuk pekerjaan staff."
      badgeText="Staff"
    >
      <ImporPage />
    </RoleRoutePage>
  );
}
