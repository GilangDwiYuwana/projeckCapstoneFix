import RoleRoutePage from '@/components/RoleRoutePage';
import StockPage from '@/app/stock/page';

export default function StaffStockBarangPage() {
  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Stock Barang"
      subtitle="Pantau ketersediaan stok barang yang menjadi tanggung jawab tim staff."
      badgeText="Staff"
    >
      <StockPage />
    </RoleRoutePage>
  );
}
