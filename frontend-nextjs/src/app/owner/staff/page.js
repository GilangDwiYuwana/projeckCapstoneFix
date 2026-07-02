"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, UserRoundPlus, Loader2, Trash2 } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

function StaffPageContent() {
  const { addStaff } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/staff`);
      const data = await res.json();
      setStaffList(data);
    } catch (e) {
      console.error("Gagal fetch staff:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await addStaff(form);
      setForm({ name: '', email: '', password: '', phone: '' });
      setSuccess('Staff berhasil ditambahkan.');
      fetchStaff(); // Refresh list
    } catch (e) {
      setError(e.message || 'Gagal menambahkan staff.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus akun staff ini?')) return;
    try {
      await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
      setStaffList(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Gagal hapus staff:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600"><UserRoundPlus className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Manajemen Staff</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Buat akun staff</h1>
            <p className="mt-2 text-sm text-slate-500">Owner bisa menambahkan akun staff yang akan login ke sistem.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Form Tambah Staff */}
        <form onSubmit={handleSubmit} className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Tambah akun staff</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Nama
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="password" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              No. HP
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" />
            </label>
          </div>
          {error   && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3">{success}</p>}
          <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Staff'}
          </button>
        </form>

        {/* Daftar Staff */}
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Daftar staff</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-red-600" /></div>
          ) : (
            <div className="mt-6 space-y-3">
              {staffList.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada staff terdaftar.</p>
              ) : staffList.map(staff => (
                <div key={staff.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{staff.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{staff.email}</p>
                    <p className="mt-1 text-sm text-slate-500">{staff.phone}</p>
                  </div>
                  <button onClick={() => handleDelete(staff.id)} className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <RoleGuard allowedRoles={['owner']}>
      <StaffPageContent />
    </RoleGuard>
  );
}