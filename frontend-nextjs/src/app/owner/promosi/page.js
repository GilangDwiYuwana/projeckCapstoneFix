"use client";

import { useState } from 'react';
import { Megaphone, PlusCircle, Send, Loader2, Trash2 } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

function PromotionPageContent() {
  const { promotionSuggestions, addPromotion, fetchPromosi } = useAuth();
  const [title, setTitle]   = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !detail.trim()) return;
    setSaving(true);
    try {
      await addPromotion({ title, detail });
      setTitle('');
      setDetail('');
    } catch (e) {
      console.error("Gagal tambah promosi:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/promosi/${id}`, { method: 'DELETE' });
      fetchPromosi(); // Refresh dari backend
    } catch (e) {
      console.error("Gagal hapus promosi:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Megaphone className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Saran Promosi</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Tambah saran promosi untuk staff</h1>
            <p className="mt-2 text-sm text-slate-500">Owner bisa mengirimkan instruksi promosi yang nanti tampil di dashboard staff.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Buat saran promosi</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Judul
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Contoh: Promo Cashback Akhir Pekan" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Detail
              <textarea value={detail} onChange={e => setDetail(e.target.value)} className="mt-1 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Tuliskan instruksi promosi yang ingin dikirimkan..." required />
            </label>
          </div>
          <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Saran Promosi'}
          </button>
        </form>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <PlusCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-slate-900">Daftar saran promosi</h2>
          </div>
          <div className="mt-6 space-y-3">
            {promotionSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada saran promosi.</p>
            ) : promotionSuggestions.map(item => (
              <div key={item.id} className="flex items-start justify-between rounded-2xl border border-slate-200 p-4 gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.author}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50 transition shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromotionPage() {
  return (
    <RoleGuard allowedRoles={['owner']}>
      <PromotionPageContent />
    </RoleGuard>
  );
}