"use client";

import { useState, useRef } from 'react';
import { FileText, Sparkles, UploadCloud, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function ImporPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [message, setMessage]           = useState('');
  const fileInputRef                    = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setMessage(''); }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage('Memproses dataset...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch(`${API_BASE}/upload-dataset`, { method: 'POST', body: formData });
      if (res.ok) {
        setMessage('Sukses! Data telah diunggah ke server.');
        setSelectedFile(null);
      } else {
        setMessage('Gagal mengunggah data.');
      }
    } catch {
      setMessage('Terjadi kesalahan koneksi ke server.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)] backdrop-blur">
        <h3 className="text-2xl font-bold text-slate-900">Unggah file dataset</h3>
        <p className="text-sm text-slate-500">Upload file Excel atau CSV agar sistem bisa memproses data.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

          <div onClick={() => fileInputRef.current.click()} className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition-colors hover:border-red-400 hover:bg-red-50/50">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
                <p className="text-lg font-bold text-slate-800">{selectedFile.name}</p>
                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="mt-4 text-sm text-red-600 underline">Ganti File</button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="mb-3 h-12 w-12 text-red-500" />
                <p className="text-lg font-semibold text-slate-800">Pilih File Dataset</p>
                <p className="text-sm text-slate-500 mt-1">.xlsx, .xls, atau .csv</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <button onClick={handleUpload} disabled={uploading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:bg-slate-400">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {uploading ? 'Sedang Memproses...' : 'Proses Data ke Server'}
            </button>
          )}

          {message && <p className="mt-4 text-center text-sm font-semibold text-slate-700">{message}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="font-semibold text-slate-900">Format Data</p>
            <p className="text-sm text-slate-500 mt-1">Menerima .xlsx dan .csv. Pastikan format kolom konsisten dengan tabel data penjualan.</p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="font-semibold text-slate-900">Langkah Selanjutnya</p>
            <p className="text-sm text-slate-500 mt-1">Setelah upload berhasil, pergi ke halaman Training Model untuk melatih ulang model AI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}