"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, ShieldAlert, Award, Zap,
  Sparkles, Target, MessageCircle, Loader2
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

const strategiEngine = {
  puncak: {
    id: 'puncak', label: 'Omset Tinggi (Puncak)',
    icon: <Award className="h-4 w-4" />,
    tabClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
    title: 'Fase Retensi & Maksimalkan Margin',
    desc: 'Prediksi omset berada di puncak. Fokus pada pelayanan VIP dan mempertahankan pelanggan setia.',
    actionBtn: { text: 'Terapkan Program VIP', icon: <Sparkles className="h-4 w-4" />, color: 'bg-emerald-600 hover:bg-emerald-700' },
    rekomendasi: [
      { judul: 'VIP Service', detail: 'Prioritas servis eksklusif untuk pelanggan loyal.', prioritas: 'Tinggi', potensi: '+20%', warna: 'emerald' },
      { judul: 'Tahan Diskon', detail: 'Jaga margin keuntungan, tidak perlu banting harga.', prioritas: 'Medium', potensi: '+15%', warna: 'emerald' },
    ],
    highlightJudul: 'Pertahankan Momentum',
    highlightDesc: 'Omset tinggi — jaga kualitas layanan dan hindari diskon berlebihan.',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  naik: {
    id: 'naik', label: 'Tren Meningkat',
    icon: <TrendingUp className="h-4 w-4" />,
    tabClass: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
    title: 'Fase Agresif — Scale Up Sekarang',
    desc: 'Momentum pasar naik! Saatnya scale-up promosi dan perluas jangkauan pasar.',
    actionBtn: { text: 'Scale-Up Iklan', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-blue-600 hover:bg-blue-700' },
    rekomendasi: [
      { judul: 'Flash Sale', detail: 'Promo akhir pekan untuk mendorong konversi cepat.', prioritas: 'Tinggi', potensi: '+25%', warna: 'blue' },
      { judul: 'Iklan Digital', detail: 'Optimalkan budget iklan saat ROI sedang puncak.', prioritas: 'Tinggi', potensi: '+30%', warna: 'blue' },
    ],
    highlightJudul: 'Bakar Budget Iklan',
    highlightDesc: 'ROI iklan sedang optimal — maksimalkan anggaran promosi.',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  turun: {
    id: 'turun', label: 'Indikasi Turun',
    icon: <TrendingDown className="h-4 w-4" />,
    tabClass: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
    title: 'Fase Antisipasi — Cegah Penurunan',
    desc: 'Deteksi pelemahan omset. Segera luncurkan promo untuk menahan penurunan.',
    actionBtn: { text: 'Retargeting Pelanggan', icon: <Target className="h-4 w-4" />, color: 'bg-amber-600 hover:bg-amber-700' },
    rekomendasi: [
      { judul: 'Subsidi & Cashback', detail: 'Insentif tukar tambah untuk user lama.', prioritas: 'Tinggi', potensi: '+8%', warna: 'amber' },
      { judul: 'Diskon Terbatas', detail: 'Promo waktu terbatas untuk menciptakan urgensi.', prioritas: 'Medium', potensi: '+12%', warna: 'amber' },
    ],
    highlightJudul: 'Cegah Penurunan Lebih Lanjut',
    highlightDesc: 'Berikan cashback dadakan dan retargeting pelanggan lama.',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  kritis: {
    id: 'kritis', label: 'Omset Anjlok',
    icon: <ShieldAlert className="h-4 w-4" />,
    tabClass: 'bg-red-600 text-white shadow-lg shadow-red-600/30',
    title: 'Fase Survival — Tim Turun Lapangan',
    desc: 'Penjualan lesu. Tim harus jemput bola, buka booth, dan blast WA pelanggan.',
    actionBtn: { text: 'Blast WA Darurat', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-red-600 hover:bg-red-700' },
    rekomendasi: [
      { judul: 'Kanvasing Langsung', detail: 'Buka booth di lokasi strategis dan pasar.', prioritas: 'Darurat', potensi: 'Pemulihan', warna: 'red' },
      { judul: 'Promo Ekstrem', detail: 'Diskon besar untuk menguras stok dan cash flow.', prioritas: 'Darurat', potensi: 'Bertahan', warna: 'red' },
    ],
    highlightJudul: 'Sales Turun Lapangan!',
    highlightDesc: 'Perbanyak interaksi fisik dan hubungi calon pelanggan secara langsung.',
    badgeColor: 'bg-red-100 text-red-700',
  },
};

export default function PromosiPage() {
  const [kondisi, setKondisi]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [omsetData, setOmsetData] = useState(null);
  const [produkList, setProdukList] = useState([]);
  const [selectedProduk, setSelectedProduk] = useState('');
  const [selectedMetode, setSelectedMetode] = useState('Cash');

  // Ambil daftar produk
  useEffect(() => {
    const fetchProduk = async () => {
      try {
        const res  = await fetch(`${API_BASE}/produk`);
        const data = await res.json();
        setProdukList(data);
        if (data.length > 0) {
          setSelectedProduk(data[0].name);
        }
      } catch (e) { console.error("Gagal fetch produk:", e); }
    };
    fetchProduk();
  }, []);

  // Fetch kondisi saat produk/metode tersedia
  useEffect(() => {
    if (selectedProduk) fetchKondisi();
  }, [selectedProduk, selectedMetode]);

  const fetchKondisi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/prediksi-tren?produk=${encodeURIComponent(selectedProduk)}&metode=${encodeURIComponent(selectedMetode)}&jumlah_bulan=1`
      );
      const data = await res.json();
      if (data.data_tren && data.data_tren.length > 0) {
        const omset = data.data_tren[0].omset;
        setOmsetData(omset);
        if      (omset > 100000000) setKondisi('puncak');
        else if (omset > 70000000)  setKondisi('naik');
        else if (omset > 40000000)  setKondisi('turun');
        else                        setKondisi('kritis');
      } else {
        setKondisi('naik');
      }
    } catch (e) {
      setKondisi('naik');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !kondisi) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
      </div>
    );
  }

  const activeData = strategiEngine[kondisi];
  const formatRp = (val) => `Rp ${Number(val).toLocaleString('id-ID')}`;

  return (
    <div className="fade-in space-y-6">

      {/* SELECTOR PARAMETER */}
      <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-700">AI Analisis Kondisi Pasar</span>
          </div>
          <div className="flex flex-wrap gap-3 sm:ml-auto">
            <select
              value={selectedProduk}
              onChange={e => setSelectedProduk(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              {produkList.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select
              value={selectedMetode}
              onChange={e => setSelectedMetode(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="Cash">Cash</option>
              <option value="Kredit">Kredit</option>
              <option value="Leasing">Leasing</option>
            </select>
          </div>
        </div>
      </div>

      {/* STATUS BADGE */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm w-fit">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${activeData.badgeColor}`}>
          {activeData.icon} {activeData.label}
        </span>
        {omsetData && (
          <span className="text-sm text-slate-500">
            Prediksi bulan depan: <span className="font-bold text-slate-900">{formatRp(omsetData)}</span>
          </span>
        )}
      </div>

      {/* HERO */}
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-lg">
        <h3 className="text-3xl font-extrabold text-slate-950">{activeData.title}</h3>
        <p className="mt-4 max-w-2xl text-sm text-slate-600">{activeData.desc}</p>
        <button className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${activeData.actionBtn.color}`}>
          {activeData.actionBtn.icon} {activeData.actionBtn.text}
        </button>
      </div>

      {/* REKOMENDASI */}
      <div className="grid gap-4 sm:grid-cols-2">
        {activeData.rekomendasi.map((item, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-bold text-slate-900">{item.judul}</h4>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold bg-${item.warna}-100 text-${item.warna}-700 shrink-0`}>
                {item.prioritas}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">Potensi kenaikan:</span>
              <span className="text-sm font-bold text-slate-900">{item.potensi}</span>
            </div>
          </div>
        ))}
      </div>

      {/* HIGHLIGHT */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <p className="font-bold text-amber-900">{activeData.highlightJudul}</p>
        <p className="mt-1 text-sm text-amber-800">{activeData.highlightDesc}</p>
      </div>
    </div>
  );
}