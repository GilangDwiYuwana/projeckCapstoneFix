"use client";

import React, { useState, useEffect } from 'react';
import { Boxes, TrendingUp, ShieldCheck, Plus, Minus, X, History, ArrowLeft, ArrowDownRight, ArrowUpRight, UserCircle, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

export default function StockPage() {
  const { user } = useAuth();
  const loggedInLabel = user ? `${user.name} (${user.role === 'owner' ? 'Admin' : 'Staff'})` : 'Unknown';

  const [stockItems, setStockItems]   = useState([]);
  const [riwayatStok, setRiwayatStok] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('ringkasan');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMotor, setSelectedMotor] = useState(null);
  const [actionType, setActionType]   = useState('');
  const [inputJumlah, setInputJumlah] = useState('');
  const [inputAlamat, setInputAlamat] = useState('');
  const [inputKeterangan, setInputKeterangan] = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    fetchStok();
    fetchRiwayat();
  }, []);

  const fetchStok = async () => {
    try {
      const res  = await fetch(`${API_BASE}/stok`);
      const data = await res.json();
      setStockItems(data);
    } catch (e) { console.error("Gagal fetch stok:", e); }
    finally { setLoading(false); }
  };

  const fetchRiwayat = async () => {
    try {
      const res  = await fetch(`${API_BASE}/stok/riwayat`);
      const data = await res.json();
      setRiwayatStok(data);
    } catch (e) { console.error("Gagal fetch riwayat:", e); }
  };

  const totalUnit   = stockItems.reduce((total, item) => total + item.stok, 0);
  const kondisiAman = stockItems.length > 0
    ? Math.round((stockItems.filter(i => i.stok > 10).length / stockItems.length) * 100)
    : 0;

  const openModal = (motor, type) => {
    setSelectedMotor(motor);
    setActionType(type);
    setInputJumlah('');
    setInputAlamat('');
    setInputKeterangan('');
    setIsModalOpen(true);
  };

  const handleSimpan = async () => {
    const jumlah = parseInt(inputJumlah);
    if (isNaN(jumlah) || jumlah <= 0) return alert("Masukkan jumlah yang valid!");
    if (actionType === 'keluar' && inputAlamat.trim() === '') return alert("Alamat pelanggan wajib diisi untuk transaksi penjualan!");
    if (!user?.id) return alert("Sesi login tidak valid, silakan login ulang.");

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/stok/${selectedMotor.id}/update`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:      actionType,
          jumlah:      jumlah,
          alamat:      inputAlamat || '-',
          keterangan:  inputKeterangan,
          id_user:     user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Terjadi kesalahan.');
        return;
      }

      const result = await res.json();
      setStockItems(prev => prev.map(item =>
        item.id === selectedMotor.id ? result.stok : item
      ));
      setRiwayatStok(prev => [{ ...result.riwayat, petugas: loggedInLabel }, ...prev]);
      setIsModalOpen(false);
    } catch (e) {
      alert("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 relative">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Stock Barang</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Pantau ketersediaan stok motor</h3>
            <p className="mt-1 text-sm text-slate-500">Kelola barang masuk dan keluar untuk kontrol distribusi yang lebih baik.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
            <UserCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Aktif: <strong className="text-slate-900">{loggedInLabel}</strong></span>
          </div>
        </div>
      </div>

      {/* STATISTIK */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-2 text-red-600"><Boxes className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Total Unit</p><p className="text-xl font-bold text-slate-900">{totalUnit}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Pergerakan Aktif</p><p className="text-xl font-bold text-slate-900">{riwayatStok.length} Transaksi</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-sm text-slate-500">Kondisi Aman</p><p className="text-xl font-bold text-slate-900">{kondisiAman}%</p></div>
          </div>
        </div>
      </div>

      {/* TABEL UTAMA */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-200/70 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            {activeTab === 'ringkasan' ? <Boxes className="w-5 h-5 text-slate-500" /> : <History className="w-5 h-5 text-slate-500" />}
            {activeTab === 'ringkasan' ? 'Ringkasan Stok' : 'Riwayat Pergerakan Barang'}
          </h4>
          <button onClick={() => setActiveTab(activeTab === 'ringkasan' ? 'riwayat' : 'ringkasan')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition">
            {activeTab === 'ringkasan' ? <><History className="w-4 h-4" /> Lihat Riwayat</> : <><ArrowLeft className="w-4 h-4" /> Kembali ke Stok</>}
          </button>
        </div>

        {activeTab === 'ringkasan' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Nama Motor</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Stok Saat Ini</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-center">Aksi Gudang</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map(item => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{item.nama}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold">{item.stok} unit</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.stok > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {item.stok > 10 ? 'Tersedia' : 'Menipis'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => openModal(item, 'masuk')} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition" title="Barang Masuk"><Plus className="w-4 h-4" /></button>
                      <button onClick={() => openModal(item, 'keluar')} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition" title="Barang Keluar"><Minus className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Waktu</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Tipe</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Detail Motor</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Info & Alamat</th>
                  <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em]">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {riwayatStok.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">Belum ada riwayat pergerakan stok.</td></tr>
                ) : riwayatStok.map((riwayat, idx) => (
                  <tr key={riwayat.id || idx} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{riwayat.tanggal}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${riwayat.jenis === 'masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {riwayat.jenis === 'masuk' ? <ArrowDownRight className="w-3 h-3"/> : <ArrowUpRight className="w-3 h-3"/>}
                        {riwayat.jenis === 'masuk' ? 'Masuk' : 'Keluar'}
                      </span>
                      <div className="mt-1 text-xs font-bold text-slate-700">{riwayat.jumlah} unit</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{riwayat.nama}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{riwayat.keterangan}</p>
                      {riwayat.alamat && riwayat.alamat !== '-' && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium bg-slate-50 p-1 rounded">
                          <MapPin className="w-3 h-3 text-red-500" /> {riwayat.alamat}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        <UserCircle className="w-4 h-4 text-slate-400" /> {riwayat.petugas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {actionType === 'masuk'
                  ? <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600"><Plus className="w-5 h-5"/></span>
                  : <span className="p-1.5 rounded-lg bg-red-100 text-red-600"><Minus className="w-5 h-5"/></span>}
                Input Barang {actionType === 'masuk' ? 'Masuk' : 'Keluar'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-5 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Motor Terpilih</p>
              <p className="font-bold text-slate-900">{selectedMotor?.nama}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <p className="text-sm text-slate-600">Sisa Stok saat ini: <span className="font-bold">{selectedMotor?.stok} Unit</span></p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Unit</label>
                <input type="number" min="1" value={inputJumlah} onChange={e => setInputJumlah(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" placeholder="Contoh: 5" />
              </div>
              {actionType === 'keluar' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Pengiriman Pelanggan <span className="text-red-500">*</span></label>
                  <textarea value={inputAlamat} onChange={e => setInputAlamat(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none" placeholder="Contoh: Kec. Koto Tangah, Kota Padang" rows={2} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Keterangan (Opsional)</label>
                <input type="text" value={inputKeterangan} onChange={e => setInputKeterangan(e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" placeholder={actionType === 'masuk' ? "Contoh: Restock gudang utama" : "Contoh: Terjual Cash Bpk. Budi"} />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition">Batal</button>
              <button onClick={handleSimpan} disabled={saving} className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all ${actionType === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-slate-400`}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}