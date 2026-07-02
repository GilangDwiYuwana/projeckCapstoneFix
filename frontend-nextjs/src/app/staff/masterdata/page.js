"use client";

import { useState, useMemo, useEffect } from 'react';
import { Eye, Info, Search, Filter, Loader2 } from 'lucide-react';
import RoleRoutePage from '@/components/RoleRoutePage';
import { API_BASE } from '@/lib/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function StaffMasterDataPage() {
  const [data, setData]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const res  = await fetch(`${API_BASE}/produk`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Gagal fetch produk:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduk();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch   = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [data, searchQuery, selectedCategory]);

  return (
    <RoleRoutePage
      allowedRoles={['staff']}
      title="Master Data"
      subtitle="Lihat data utama yang menjadi acuan operasional."
      badgeText="Staff"
    >
      <div className="flex flex-col gap-6">

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Mode Staf (Read-Only)</p>
            <p className="mt-1 text-sm text-blue-600/80">Anda memiliki akses untuk melihat referensi data master dan ketersediaan stok barang. Perubahan data hanya dapat dilakukan oleh Owner.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Daftar Item</h3>
              <p className="text-sm text-slate-500">Menampilkan {filteredData.length} data tersedia.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Cari nama motor..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500" />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-10 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500 cursor-pointer">
                  <option value="Semua">Semua Kategori</option>
                  <option value="Metic">Metic</option>
                  <option value="Kopling">Kopling</option>
                  <option value="Gigi">Gigi</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-6 py-4 font-semibold">No</th>
                    <th className="px-6 py-4 font-semibold">Nama Motor</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold">Harga</th>
                    <th className="px-6 py-4 font-semibold">Stok</th>
                    <th className="px-6 py-4 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredData.length > 0 ? filteredData.map((row, index) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{row.category}</span></td>
                      <td className="px-6 py-4">{formatCurrency(row.price)}</td>
                      <td className="px-6 py-4"><span className={`font-medium ${row.stock < 10 ? 'text-red-600' : 'text-slate-900'}`}>{row.stock}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm">
                            <Eye className="h-4 w-4" /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="h-8 w-8 text-slate-300" />
                          <p>Tidak ada data yang cocok dengan pencarian Anda.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleRoutePage>
  );
}