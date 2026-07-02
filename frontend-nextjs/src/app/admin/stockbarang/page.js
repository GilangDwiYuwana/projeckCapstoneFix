import RoleRoutePage from '@/components/RoleRoutePage';
import StockPage from '@/app/stock/page';

export default function AdminStockBarangPage() {
  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Stock Barang"
      subtitle="Pantau dan kelola stok barang untuk kebutuhan operasional admin."
      badgeText="Admin / Owner"
    >
      <StockPage />
    </RoleRoutePage>
  );
}
