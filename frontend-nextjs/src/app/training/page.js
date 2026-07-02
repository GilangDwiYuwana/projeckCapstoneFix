"use client";

import { useState, useEffect } from 'react';
import { Play, Loader2, FileCheck } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function TrainingPage() {
  const [isTraining, setIsTraining] = useState(false);
  const [log, setLog] = useState([
    { text: "[SYSTEM] XGBoost Engine v3.2.1 initialized", color: "text-emerald-400" },
    { text: "[READY] Mengecek ketersediaan dataset...", color: "text-slate-300" },
  ]);

  useEffect(() => {
    const checkDataset = async () => {
      try {
        const res  = await fetch(`${API_BASE}/check-dataset`);
        const data = await res.json();
        if (data.exists) {
          setLog(prev => [...prev, { text: "[INFO] Dataset terdeteksi! Siap untuk Retrain.", color: "text-blue-400" }]);
        } else {
          setLog(prev => [...prev, { text: "[WARNING] Dataset belum ditemukan. Silakan upload terlebih dahulu.", color: "text-amber-400" }]);
        }
      } catch {
        setLog(prev => [...prev, { text: "[ERROR] Gagal terhubung ke server.", color: "text-red-400" }]);
      }
    };
    checkDataset();
  }, []);

  const handleRetrain = async () => {
    setIsTraining(true);
    setLog(prev => [...prev, { text: "[TRAIN] Memulai pelatihan model XGBoost...", color: "text-amber-400" }]);
    try {
      const res  = await fetch(`${API_BASE}/retrain`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setLog(prev => [...prev,
          { text: "[DONE] Training completed successfully!", color: "text-emerald-400" },
          { text: "[METRICS] Model telah diperbarui dengan data terbaru.", color: "text-emerald-400" },
        ]);
      } else {
        setLog(prev => [...prev, { text: `[ERROR] ${data.message}`, color: "text-red-400" }]);
      }
    } catch {
      setLog(prev => [...prev, { text: "[ERROR] Koneksi ke backend gagal!", color: "text-red-400" }]);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Training Model</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Training Model XGBoost</h3>
          </div>
          <button onClick={handleRetrain} disabled={isTraining} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 disabled:bg-slate-400 transition">
            {isTraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isTraining ? "Sedang Melatih..." : "Mulai Retrain Model"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4">Status & Konfigurasi</h4>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileCheck className="h-4 w-4 text-emerald-500" />
            <span>Model XGBoost Ready</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-500">
            <p>Backend: <span className="font-medium text-slate-700">{API_BASE}</span></p>
            <p>Algoritma: <span className="font-medium text-slate-700">XGBoost Regressor</span></p>
            <p>Target: <span className="font-medium text-slate-700">Prediksi Omset Bulanan</span></p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-slate-900 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Training Log</span>
            <button onClick={() => setLog([])} className="text-xs text-slate-500 hover:text-slate-300 transition">Clear</button>
          </div>
          <div className="space-y-1 rounded-2xl bg-slate-950/80 p-4 text-sm font-mono overflow-auto h-48">
            {log.map((entry, i) => (
              <p key={i} className={entry.color}>{entry.text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}