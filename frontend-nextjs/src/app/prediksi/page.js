"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, Search } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function Prediksi() {
  const [chartData, setChartData]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [produkList, setProdukList] = useState([]);

  // Parameter form
  const [produk, setProduk]           = useState('');
  const [metode, setMetode]           = useState('Cash');
  const [jumlahBulan, setJumlahBulan] = useState(6);
  const [error, setError]             = useState('');

  // Ambil daftar produk dari backend untuk dropdown
  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const res  = await fetch(`${API_BASE}/produk`);
        const data = await res.json();
        setProdukList(data);
        if (data.length > 0) setProduk(data[0].name);
      } catch (e) {
        console.error("Gagal fetch produk:", e);
      }
    };
    fetchProduk();
  }, []);

  const fetchPrediksi = async () => {
    if (!produk) return;
    setLoading(true);
    setError('');
    setChartData([]);
    try {
      const res = await fetch(
        `${API_BASE}/prediksi-tren?produk=${encodeURIComponent(produk)}&metode=${encodeURIComponent(metode)}&jumlah_bulan=${jumlahBulan}`
      );
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Gagal mengambil prediksi.');
        return;
      }
      const data = await res.json();
      console.debug('prediksi-tren response:', data);
      if (data?.data_tren && Array.isArray(data.data_tren)) {
        // Normalize and coerce values from backend (handle different keys like 'omzet' or 'value')
        const normalized = data.data_tren.map((it, idx) => {
          const omsetRaw = it.omset ?? it.omzet ?? it.value ?? it.prediksi ?? 0;
          const omset = Number(omsetRaw) || 0;
          const bulan = it.bulan ?? it.month ?? it.label ?? `Bulan ${idx + 1}`;
          return {
            ...it,
            bulan,
            omset,
            rekomendasi: it.rekomendasi ?? it.saran ?? it.note ?? '-',
          };
        });
        setChartData(normalized);
      } else {
        console.warn('prediksi-tren: unexpected response shape', data);
        setError('Server mengembalikan format data tidak dikenal.');
      }
    } catch (e) {
      setError('Gagal terhubung ke server. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // SVG chart config
  const hasData  = chartData.length > 0;
  const width    = 620;
  const height   = 300;
  const padding  = 40;
  let maxValue = hasData ? Math.max(...chartData.map(i => Number(i.omset) || 0)) * 1.1 : 100;
  const minValue = 0;
  if (!isFinite(maxValue) || maxValue <= minValue) maxValue = minValue + 1;

  const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
  const getY = (omset) => height - padding - ((omset - minValue) / (maxValue - minValue)) * (height - padding * 2);

  const buildLine = () =>
    chartData.map((item, i) => `${getX(i)},${getY(item.omset)}`).join(' ');

  const formatRp = (val) => `Rp ${Number(val).toLocaleString('id-ID')}`;

  return (
    <div className="fade-in space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur">
        <h3 className="text-2xl font-bold text-slate-900">Prediksi Penjualan XGBoost</h3>
        <p className="mt-0.5 text-sm text-slate-500">Visualisasi tren omset berdasarkan model AI terkini</p>
      </div>

      {/* FORM PARAMETER */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h4 className="font-semibold text-slate-900 mb-4">Parameter Prediksi</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Produk</label>
            <select
              value={produk}
              onChange={e => setProduk(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              {produkList.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Metode Pembayaran</label>
            <select
              value={metode}
              onChange={e => setMetode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="Cash">Cash</option>
              <option value="Kredit">Kredit</option>
              <option value="Leasing">Leasing</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Jumlah Bulan</label>
            <select
              value={jumlahBulan}
              onChange={e => setJumlahBulan(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              {[3, 6, 9, 12].map(n => (
                <option key={n} value={n}>{n} Bulan</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchPrediksi}
            disabled={loading || !produk}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-slate-400"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Memproses...' : 'Prediksi Sekarang'}
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* CHART + SUMMARY */}
      {hasData && (
        <div className="grid gap-6 xl:grid-cols-4">
          {/* Grafik */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm xl:col-span-3">
            <h4 className="mb-4 font-semibold text-slate-900">Grafik Prediksi Omset</h4>
            <div className="h-[320px] w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = height - padding - ratio * (height - padding * 2);
                  return (
                    <g key={i}>
                      <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
                      <text x={padding - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
                        {formatRp(maxValue * ratio)}
                      </text>
                    </g>
                  );
                })}
                {/* Line */}
                <polyline fill="none" stroke="#CC0000" strokeWidth="2.5" strokeLinejoin="round" points={buildLine()} />
                {/* Area fill */}
                <polyline
                  fill="url(#redGradient)" fillOpacity="0.1" stroke="none"
                  points={`${getX(0)},${height - padding} ${buildLine()} ${getX(chartData.length - 1)},${height - padding}`}
                />
                <defs>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#CC0000" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#CC0000" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Data points */}
                {chartData.map((item, index) => {
                  const x = getX(index);
                  const y = getY(item.omset);
                  return (
                    <g key={index}>
                      <circle cx={x} cy={y} r="5" fill="#CC0000" stroke="white" strokeWidth="2" />
                      <text x={x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748b">{item.bulan}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">Prediksi Bulan Pertama</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatRp(chartData[0].omset)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">Prediksi Bulan Terakhir</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{formatRp(chartData[chartData.length - 1].omset)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-400">Total Prediksi</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatRp(chartData.reduce((s, i) => s + i.omset, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TABEL DETAIL + REKOMENDASI */}
      {hasData && (
        <>
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h4 className="mb-4 font-semibold text-slate-900">Detail Per Bulan</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Bulan</th>
                    <th className="px-4 py-3 font-semibold">Prediksi Omset</th>
                    <th className="px-4 py-3 font-semibold">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium">{item.bulan}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatRp(item.omset)}</td>
                      <td className="px-4 py-3 text-slate-500">{item.rekomendasi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">Rekomendasi Strategi AI (Bulan Pertama)</h4>
            </div>
            <p className="text-sm text-slate-600">{chartData[0].rekomendasi}</p>
          </div>
        </>
      )}

      {/* EMPTY STATE */}
      {!hasData && !loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Search className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">Pilih parameter dan klik Prediksi Sekarang</p>
          <p className="text-sm text-slate-400 mt-1">Hasil prediksi akan ditampilkan di sini</p>
        </div>
      )}
    </div>
  );
}