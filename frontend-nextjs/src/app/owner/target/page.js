"use client";

import { useState, useEffect } from 'react';
import { Target, Save, TrendingUp, Loader2 } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';

function getCurrentMonthDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function TargetPageContent() {
  const { targetSettings, setTargetSettings } = useAuth();
  const [periodDate, setPeriodDate] = useState(getCurrentMonthDate());
  const [omset, setOmset]           = useState(targetSettings.omset || 0);
  const [sales, setSales]           = useState(targetSettings.sales || 0);
  const [saved, setSaved]           = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    setOmset(targetSettings.omset || 0);
    setSales(targetSettings.sales || 0);
  }, [targetSettings]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setTargetSettings({ period: periodDate, omset, sales });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Gagal simpan target:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Target className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Target Penjualan</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Atur target omset dan penjualan</h1>
            <p className="mt-2 text-sm text-slate-500">Target ini akan muncul di dashboard staff.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Target Aktif */}
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-slate-900">Target aktif</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Periode</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{targetSettings.period}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Target Omset</p>
              <p className="mt-1 text-xl font-bold text-slate-900">Rp {Number(targetSettings.omset).toLocaleString('id-ID')}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Target Penjualan</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{targetSettings.sales} unit</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Form target</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Bulan & Tahun
              <input
                type="month"
                value={periodDate.slice(0, 7)}
                onChange={e => setPeriodDate(`${e.target.value}-01`)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Target Omset
              <input value={omset} onChange={e => setOmset(Number(e.target.value))} type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Target Penjualan (unit)
              <input value={sales} onChange={e => setSales(Number(e.target.value))} type="number" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
            </label>
          </div>
          <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Target'}
          </button>
          {saved && <p className="mt-3 text-sm text-emerald-600">Target berhasil disimpan ke database.</p>}
        </form>
      </div>
    </div>
  );
}

export default function TargetPage() {
  return (
    <RoleGuard allowedRoles={['owner']}>
      <TargetPageContent />
    </RoleGuard>
  );
}