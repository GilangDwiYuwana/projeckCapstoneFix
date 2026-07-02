export const initialOwner = {
  id: 'owner-1',
  name: 'Owner Honda',
  email: 'owner@honda.com',
  password: 'owner123',
  role: 'owner',
};

export const initialStaffAccounts = [
  {
    id: 'staff-1',
    name: 'Budi Santoso',
    email: 'staff@honda.com',
    password: 'staff123',
    role: 'staff',
    phone: '0812-1111-2222',
  },
];

export const initialTargetSettings = {
  period: 'Juni 2026',
  omset: 5000000000,
  sales: 140,
};

export const initialPromotions = [
  {
    id: 1,
    title: 'Promo Cashback Servis',
    detail: 'Diskon khusus untuk pelanggan yang melakukan servis di bulan ini.',
    author: 'Owner',
  },
  {
    id: 2,
    title: 'Tenor Ringan',
    detail: 'Cicilan ringan untuk pembelian motor matic dan sport.',
    author: 'Owner',
  },
];

export const salesSummary = {
  currentMonthSales: 124,
  currentMonthOmset: 4820000000,
  previousMonthSales: 116,
  previousMonthOmset: 4510000000,
};

export const salesReports = [
  { date: '2026-06-01', sales: 18, omset: 680000000 },
  { date: '2026-06-02', sales: 15, omset: 610000000 },
  { date: '2026-06-03', sales: 21, omset: 760000000 },
  { date: '2026-06-04', sales: 17, omset: 690000000 },
];
