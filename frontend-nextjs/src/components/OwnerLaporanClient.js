"use client";

import { useState, useEffect } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { API_BASE } from '@/lib/api';

function ReportPageContent() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res  = await fetch(`${API_BASE}/laporan`);
        const data = await res.json();
        setLaporan(data);
      } catch (e) {
        console.error("Gagal fetch laporan:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const handleDownload = async () => {
    try {
      const res  = await fetch(`${API_BASE}/laporan/csv`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = 'laporan-penjualan.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Gagal download laporan:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Laporan Penjualan</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Download laporan penjualan</h1>
            <p className="mt-2 text-sm text-slate-500">Hanya owner/admin yang bisa mengunduh file laporan.</p>
          </div>
        </div>
      </div>

      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Data laporan</h2>
            <p className="text-sm text-slate-500">{laporan.length} laporan tersedia</p>
          </div>
          <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 transition">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="h-8 w-8 animate-spin text-red-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2"/>
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Petugas</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Omset</th>
                  <th className="px-4 py-3 font-semibold">File</th>
                </tr>
              </thead>
              <tbody>
                {laporan.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">Belum ada laporan masuk.</td></tr>
                ) : laporan.map(item => (
                  <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-4 py-3">{item.tanggal}</td>
                    <td className="px-4 py-3">{item.petugas}</td>
                    <td className="px-4 py-3">{item.units} unit</td>
                    <td className="px-4 py-3">Rp {Number(item.omset).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.filename || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerLaporanClient() {
  return (
    <RoleGuard allowedRoles={["owner"]}>
      <ReportPageContent />
    </RoleGuard>
  );
}
