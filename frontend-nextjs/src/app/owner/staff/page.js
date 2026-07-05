"use client";

import { useState, useEffect } from 'react';
import { Plus, UserRound, Loader2, Trash2, PencilLine, X } from 'lucide-react';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/api';

const EMPTY_FORM = { name: '', email: '', password: '', phone: '' };

function StaffPageContent() {
  const { addStaff, editStaff, deleteStaff } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    setEditingId(staff.id);
    setForm({ name: staff.name, email: staff.email, password: '', phone: staff.phone || '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await editStaff(editingId, form);
      } else {
        await addStaff(form);
      }
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchStaff();
    } catch (e) {
      setError(e.message || 'Gagal menyimpan data staff.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus akun staff ini?')) return;
    try {
      await deleteStaff(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Gagal hapus staff:", e);
      alert(e.message || 'Gagal menghapus staff.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Kelola akses sistem untuk tim Anda.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Staff
        </button>
      </div>

      {/* List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : staffList.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Belum ada staff terdaftar.</p>
        ) : (
          <div className="space-y-3">
            {staffList.map(staff => (
              <div
                key={staff.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{staff.name}</p>
                    <p className="text-sm text-slate-500">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(staff)}
                    className="rounded-full border border-slate-200 bg-slate-50 p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Edit staff"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(staff.id)}
                    className="rounded-full border border-rose-100 bg-rose-50 p-2.5 text-rose-500 transition hover:bg-rose-100 hover:text-rose-700"
                    aria-label="Hapus staff"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Staff */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Staff' : 'Tambah Staff'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Nama Lengkap
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  type="password"
                  placeholder={editingId ? 'Kosongkan jika tidak ingin mengubah password' : ''}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                  required={!editingId}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                No. HP
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
              )}

              <button
                disabled={saving}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Staff'}
              </button>
            </form>
          </div>
        </div>
      )}
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
