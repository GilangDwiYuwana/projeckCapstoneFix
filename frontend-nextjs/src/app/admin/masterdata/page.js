"use client";

import { useMemo, useState, useEffect } from 'react';
import { Database, Plus, Save, Trash2, PencilLine, Loader2 } from 'lucide-react';
import RoleRoutePage from '@/components/RoleRoutePage';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function AdminMasterDataPage() {
  const { user } = useAuth();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: '', category: 'Metic', price: '', stock: '' });
  const [editingId, setEditingId] = useState(null);

  const canManage = user?.role === 'owner';

  useEffect(() => { fetchProduk(); }, []);

  const fetchProduk = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/produk`);
      const data = await res.json();
      setRows(data);
    } catch (e) {
      console.error("Gagal fetch produk:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) return;

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/produk/${editingId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_motor:    form.name,
            kategori:      form.category,
            harga_terbaru: Number(form.price),
          }),
        });
        const updated = await res.json();
        setRows(prev => prev.map(item => item.id === editingId ? updated : item));
      } else {
        const res = await fetch(`${API_BASE}/produk`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_motor:    form.name,
            kategori:      form.category,
            harga_terbaru: Number(form.price),
            stok_awal:     Number(form.stock),
          }),
        });
        const newItem = await res.json();
        setRows(prev => [newItem, ...prev]);
      }
      setForm({ name: '', category: 'Metic', price: '', stock: '' });
      setEditingId(null);
    } catch (e) {
      console.error("Gagal simpan produk:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (row) => {
    if (!canManage) return;
    setEditingId(row.id);
    setForm({ name: row.name, category: row.category, price: String(row.price), stock: String(row.stock) });
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    try {
      await fetch(`${API_BASE}/produk/${id}`, { method: 'DELETE' });
      setRows(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("Gagal hapus produk:", e);
    }
  };

  const totalStock = useMemo(() => rows.reduce((sum, item) => sum + item.stock, 0), [rows]);

  return (
    <RoleRoutePage
      allowedRoles={['owner']}
      title="Master Data"
      subtitle="Kelola data utama yang menjadi acuan operasional admin dan staff."
      badgeText="Admin / Owner"
    >
      <div className="flex flex-col gap-8">

        {/* FORM INPUT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-red-50 p-2 text-red-600"><Database className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Form Master Data</h3>
              <p className="text-sm text-slate-500">Tambahkan atau edit item master data di sini.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Motor</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Honda Vario 160" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Kategori</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500">
                  <option value="Metic">Metic</option>
                  <option value="Kopling">Kopling</option>
                  <option value="Gigi">Gigi</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Harga (Rp)</label>
                <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Stok Awal {editingId && <span className="text-xs text-slate-400">(tidak bisa diubah di sini)</span>}</label>
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" type="number" disabled={!!editingId} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-slate-100" required={!editingId} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', category: 'Metic', price: '', stock: '' }); }} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Batal
                </button>
              )}
              <button type="submit" disabled={saving} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-slate-400">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Data'}
              </button>
            </div>
          </form>
        </div>

        {/* TABEL */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Daftar Master Data</h3>
              <p className="text-sm text-slate-500">Total stok saat ini: <span className="font-semibold text-slate-700">{totalStock} unit</span></p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 self-start sm:self-auto">Mode Admin</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                  {rows.length > 0 ? rows.map((row, index) => (
                    <tr key={row.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{row.category}</span></td>
                      <td className="px-6 py-4">{formatCurrency(row.price)}</td>
                      <td className="px-6 py-4">{row.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(row)} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"><PencilLine className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(row.id)} className="rounded-lg border border-rose-100 p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada data tersedia.</td></tr>
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