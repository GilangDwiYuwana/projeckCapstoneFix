"use client";

import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginStaffPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('staff@honda.com');
  const [password, setPassword] = useState('staff123');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUser = window.localStorage.getItem('honda-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        window.location.assign(user.role === 'owner' ? '/admin/dashboard' : '/staff/dashboard');
      } catch {
        window.localStorage.removeItem('honda-user');
      }
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const success = await login({ email, password, role: 'staff' });
    if (success) {
      window.location.assign('/staff/dashboard');
    } else {
      setError('Email atau password staff salah.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-4xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Login Staff</p>
            <h1 className="text-2xl font-bold text-slate-900">Masuk sebagai Staff</h1>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3" required />
          </label>
          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Memverifikasi...' : 'Masuk Staff'}
          </button>
        </form>

        <a href="/loginadmin" className="mt-4 inline-block text-sm font-semibold text-red-600">Login sebagai Admin</a>
      </div>
    </div>
  );
}