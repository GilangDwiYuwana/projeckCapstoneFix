"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BadgeDollarSign, BarChart3, Megaphone, Target,
  UploadCloud, Send, CheckCircle2, Users, Receipt, FileText, Download, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

function formatRp(value) {
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

export default function DashboardContent() {
  const { user, targetSettings, promotionSuggestions } = useAuth();

  const [salesSummary, setSalesSummary]         = useState({ currentMonthSales: 0, currentMonthOmset: 0, previousMonthOmset: 0 });
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [loadingStats, setLoadingStats]         = useState(true);

  // Form laporan staff
  const [reportUnits, setReportUnits]   = useState('');
  const [reportOmset, setReportOmset]   = useState('');
  const [reportFile, setReportFile]     = useState(null);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    fetchStats();
    if (user?.role === 'owner') fetchStaffPerformance();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Ambil laporan untuk hitung summary
      const res  = await fetch(`${API_BASE}/laporan`);
      const data = await res.json();
      if (data.length > 0) {
        const currentMonth = new Date().getMonth();
        const currentYear  = new Date().getFullYear();
        const thisMonth    = data.filter(l => {
          const d = new Date(l.tanggal);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonth = data.filter(l => {
          const d = new Date(l.tanggal);
          return d.getMonth() === (currentMonth - 1 + 12) % 12;
        });
        setSalesSummary({
          currentMonthSales:   thisMonth.reduce((s, l) => s + (l.units || 0), 0),
          currentMonthOmset:   thisMonth.reduce((s, l) => s + (l.omset || 0), 0),
          previousMonthOmset:  lastMonth.reduce((s, l) => s + (l.omset || 0), 0),
        });
      }
    } catch (e) { console.error("Gagal fetch stats:", e); }
    finally { setLoadingStats(false); }
  };

  const fetchStaffPerformance = async () => {
    try {
      const [laporanRes, staffRes] = await Promise.all([
        fetch(`${API_BASE}/laporan`),
        fetch(`${API_BASE}/staff`),
      ]);
      const laporan = await laporanRes.json();
      const staffs  = await staffRes.json();

      const perf = staffs.map(s => {
        const laporanStaff = laporan.filter(l => l.petugas && l.petugas.includes(s.name));
        return {
          id:              s.id,
          name:            s.name,
          achievedUnits:   laporanStaff.reduce((t, l) => t + (l.units || 0), 0),
          achievedOmset:   laporanStaff.reduce((t, l) => t + (l.omset || 0), 0),
          targetUnits:     targetSettings.sales,
          targetOmset:     targetSettings.omset,
          latestReportFile: laporanStaff[0]?.filename || '-',
          reportDate:      laporanStaff[0]?.tanggal || '-',
        };
      });
      setStaffPerformance(perf);
    } catch (e) { console.error("Gagal fetch staff performance:", e); }
  };

  const handleStaffReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportUnits || !reportOmset || !reportFile) return;
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/laporan`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petugas:  user?.name || 'Staff',
          units:    Number(reportUnits),
          omset:    Number(reportOmset),
          filename: reportFile.name,
        }),
      });
      setIsSubmitted(true);
      fetchStats();
      setTimeout(() => {
        setIsSubmitted(false);
        setReportUnits('');
        setReportOmset('');
        setReportFile(null);
      }, 3000);
    } catch (e) {
      console.error("Gagal kirim laporan:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const trend = salesSummary.currentMonthOmset - salesSummary.previousMonthOmset;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Halo, {user?.name || 'Owner'}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {user?.role === 'owner'
            ? 'Pantau pergerakan omset perusahaan dan periksa laporan dokumen penjualan dari tim Anda.'
            : 'Pantau pencapaian Anda, unggah dokumen rekap penjualan terbaru, dan cek saran promosi.'}
        </p>
      </div>

      {/* STATISTIK */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Unit Terjual (Tercapai)</p>
            <div className="rounded-xl bg-red-50 p-2 text-red-500"><BarChart3 className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{loadingStats ? '-' : salesSummary.currentMonthSales}</p>
          <p className="mt-2 text-sm text-slate-500">Total akumulasi bulan ini</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Omset Tercapai</p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-500"><BadgeDollarSign className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{loadingStats ? '-' : formatRp(salesSummary.currentMonthOmset)}</p>
          <p className="mt-2 text-sm text-slate-500">
            <span className={trend >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
              {trend >= 0 ? 'Naik' : 'Turun'}
            </span> dibandingkan bulan lalu
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Target {targetSettings.period}</p>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-500"><Target className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{targetSettings.sales} Unit</p>
          <p className="mt-2 text-sm text-slate-500">Target Omset: {formatRp(targetSettings.omset)}</p>
        </div>
      </div>

      {/* GRID TENGAH */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Ringkasan Pencapaian */}
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ringkasan Pencapaian</h2>
              <p className="text-sm text-slate-500">Perbandingan riil terhadap target bulanan</p>
            </div>
            {user?.role === 'owner' && (
              <Link href="/owner/target" className="text-sm font-semibold text-red-600 hover:underline">Atur Target</Link>
            )}
          </div>
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500 mb-1">Status Omset</p>
              <p className="text-2xl font-bold text-slate-900">{formatRp(salesSummary.currentMonthOmset)}</p>
              <p className="text-sm text-slate-500 mt-1">Target: {formatRp(targetSettings.omset)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500 mb-1">Status Unit Terjual</p>
              <p className="text-2xl font-bold text-slate-900">{salesSummary.currentMonthSales} Unit</p>
              <p className="text-sm text-slate-500 mt-1">Target: {targetSettings.sales} Unit</p>
            </div>
          </div>
        </div>

        {/* Widget per Role */}
        {user?.role === 'staff' ? (
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Receipt className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Kirim Laporan Penjualan</h2>
                <p className="text-sm text-slate-500">Unggah dokumen rekap penjualan Anda.</p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="mb-2 h-10 w-10" />
                <p className="font-semibold">Dokumen Berhasil Terkirim!</p>
                <p className="text-sm opacity-80 mt-1">Menunggu peninjauan admin.</p>
              </div>
            ) : (
              <form onSubmit={handleStaffReportSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Total Unit Terjual</label>
                    <input type="number" min="0" placeholder="Contoh: 12" value={reportUnits} onChange={e => setReportUnits(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Total Omset (Rp)</label>
                    <input type="number" min="0" placeholder="Contoh: 25000000" value={reportOmset} onChange={e => setReportOmset(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">File Dokumen Laporan</label>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 transition hover:border-red-400 hover:bg-red-50">
                    <UploadCloud className="mb-2 h-6 w-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 text-center px-4">
                      {reportFile ? reportFile.name : 'Klik untuk unggah file (.xlsx, .doc, .pdf)'}
                    </span>
                    <input type="file" className="hidden" onChange={e => setReportFile(e.target.files[0])} accept=".pdf,.doc,.docx,.xls,.xlsx" required />
                  </label>
                </div>
                <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-slate-400">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Mengirim...' : 'Kirim Dokumen Laporan'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600"><Users className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Laporan Penjualan Staf</h2>
                <p className="text-sm text-slate-500">Tinjau dan unduh dokumen dari tim.</p>
              </div>
            </div>
            <div className="space-y-4">
              {staffPerformance.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada laporan dari staff.</p>
              ) : staffPerformance.map(staff => (
                <div key={staff.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-bold text-slate-900">{staff.name}</p>
                      <p className="text-xs text-slate-500">Diperbarui: {staff.reportDate}</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
                      <Download className="h-3.5 w-3.5" /> Unduh Dokumen
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Pencapaian Unit</p>
                      <p className="font-semibold text-slate-900">{staff.achievedUnits} / <span className="text-slate-400 font-normal">{staff.targetUnits} Unit</span></p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pencapaian Omset</p>
                      <p className="font-semibold text-slate-900">{formatRp(staff.achievedOmset)}</p>
                      <p className="text-xs text-slate-400">Target: {formatRp(staff.targetOmset)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{staff.latestReportFile}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SARAN PROMOSI */}
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600"><Megaphone className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Saran Promosi</h2>
              <p className="text-sm text-slate-500">Rekomendasi terbaru dari owner</p>
            </div>
          </div>
          {user?.role === 'owner' && (
            <Link href="/owner/promosi" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline">
              Tambah Promo <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {promotionSuggestions.slice(0, 3).map(item => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 p-5 transition hover:shadow-md">
              <div>
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}