"use client";

import { useState } from 'react';
import { ShieldCheck, Users, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login({ email, password, role });

    if (success) {
      window.location.assign(role === 'owner' ? '/admin/dashboard' : '/staff/dashboard');
    } else {
      setError('Email atau password yang Anda masukkan salah. Silakan periksa kembali.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex flex-col justify-center bg-linear-to-br from-red-600 to-red-800 p-10 text-white lg:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
                <ShieldCheck className="mr-2 h-4 w-4 text-red-100" />
                <span className="tracking-wide">Sistem Akses Internal</span>
              </div>
              <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">
                Dashboard<br/>Penjualan Honda
              </h1>
              <p className="mt-6 text-base leading-relaxed text-red-50/90">
                Selamat datang di portal manajemen. Sistem ini dirancang untuk mempermudah pemantauan kinerja, analisis data penjualan, serta manajemen staf secara real-time.
              </p>
              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="rounded-full bg-white/20 p-2"><ShieldCheck className="h-5 w-5 text-white" /></div>
                  <div>
                    <h3 className="font-semibold text-white">Akses Owner & Admin</h3>
                    <p className="mt-1 text-sm text-red-100">Pemegang hak akses penuh untuk memantau performa dan mengelola akun staf.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="rounded-full bg-white/20 p-2"><Users className="h-5 w-5 text-white" /></div>
                  <div>
                    <h3 className="font-semibold text-white">Akses Staf</h3>
                    <p className="mt-1 text-sm text-red-100">Akses khusus staf yang didaftarkan melalui panel manajemen Admin.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 lg:p-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Login</h2>
              <p className="mt-2 text-sm text-slate-500">Silakan pilih peran dan masukkan kredensial Anda.</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { setRole('owner'); setError(''); }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all ${role === 'owner' ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <ShieldCheck className={`h-4 w-4 ${role === 'owner' ? 'text-red-600' : 'text-slate-400'}`} />
                  Owner / Admin
                </button>
                <button type="button" onClick={() => { setRole('staff'); setError(''); }}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all ${role === 'staff' ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                  <Users className={`h-4 w-4 ${role === 'staff' ? 'text-red-600' : 'text-slate-400'}`} />
                  Staff
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Alamat Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                    placeholder={`Masukkan email ${role}...`}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
                    placeholder="Masukkan kata sandi..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10"
                    required />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <p>{error}</p>
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-70">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  <><LogIn className="h-5 w-5" /> Masuk ke Sistem</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}