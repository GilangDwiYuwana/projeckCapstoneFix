"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                          = useState(null);
  const [isHydrated, setIsHydrated]               = useState(false);
  const [staffAccounts, setStaffAccounts]         = useState([]);
  const [targetSettings, setTargetSettingsState]  = useState({ period: 'Belum diatur', omset: 0, sales: 0 });
  const [promotionSuggestions, setPromotionSuggestions] = useState([]);

  // ── Hydrate dari localStorage + fetch data awal ──────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = window.localStorage.getItem('honda-user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { /* abaikan */ }
    }
    setIsHydrated(true);

    fetchTarget();
    fetchPromosi();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) window.localStorage.setItem('honda-user', JSON.stringify(user));
    else       window.localStorage.removeItem('honda-user');
  }, [user]);

  // ── Helpers fetch ─────────────────────────────────────────────────────
  const fetchTarget = async () => {
    try {
      const res  = await fetch(`${API_BASE}/target`);
      const data = await res.json();
      setTargetSettingsState(data);
    } catch (e) { console.error("Gagal fetch target:", e); }
  };

  const fetchPromosi = async () => {
    try {
      const res  = await fetch(`${API_BASE}/promosi`);
      const data = await res.json();
      setPromotionSuggestions(data);
    } catch (e) { console.error("Gagal fetch promosi:", e); }
  };

  const fetchStaff = async () => {
    try {
      const res  = await fetch(`${API_BASE}/staff`);
      const data = await res.json();
      setStaffAccounts(data);
    } catch (e) { console.error("Gagal fetch staff:", e); }
  };

  // ── AUTH ──────────────────────────────────────────────────────────────
  const login = async ({ email, password, role }) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.status === 'success') {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('honda-user', JSON.stringify(data.user));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('honda-user');
    }
  };

  // ── STAFF (backend expect: nama_lengkap, email, password) ─────────────
  const addStaff = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: payload.name,
          email:        payload.email,
          password:     payload.password,
          phone:        payload.phone || '',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal menambah staff');
      }
      const newStaff = await res.json();
      setStaffAccounts(prev => [newStaff, ...prev]);
      return newStaff;
    } catch (e) {
      console.error("addStaff error:", e);
      throw e;
    }
  };

  const editStaff = async (id, payload) => {
    try {
      const body = {
        nama_lengkap: payload.name,
        email:        payload.email,
        phone:        payload.phone || '',
      };
      if (payload.password) {
        body.password = payload.password;
      }

      const res = await fetch(`${API_BASE}/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal memperbarui staff');
      }
      const updatedStaff = await res.json();
      setStaffAccounts(prev => prev.map(item => item.id === id ? updatedStaff : item));
      return updatedStaff;
    } catch (e) {
      console.error("editStaff error:", e);
      throw e;
    }
  };

  const deleteStaff = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal menghapus staff');
      }
      setStaffAccounts(prev => prev.filter(item => item.id !== id));
    } catch (e) {
      console.error("deleteStaff error:", e);
      throw e;
    }
  };

  // ── TARGET (backend expect: bulan_tahun, target_unit, estimasi_omset) ─
  const setTargetSettings = async ({ period, omset, sales }) => {
    try {
      // period diharapkan format tanggal YYYY-MM-DD (tanggal 1 di bulan terkait)
      const bulanTahun = period.length === 10 && period.includes('-')
        ? period
        : new Date().toISOString().slice(0, 8) + '01'; // fallback bulan ini

      const res = await fetch(`${API_BASE}/target`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulan_tahun:    bulanTahun,
          target_unit:    sales,
          estimasi_omset: omset,
        }),
      });
      const data = await res.json();
      setTargetSettingsState(data);
    } catch (e) { console.error("setTarget error:", e); }
  };

  // ── PROMOSI ───────────────────────────────────────────────────────────
  const addPromotion = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/promosi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, author: user?.name || 'Owner' }),
      });
      const newItem = await res.json();
      setPromotionSuggestions(prev => [newItem, ...prev]);
      return newItem;
    } catch (e) { console.error("addPromotion error:", e); }
  };

  const value = useMemo(() => ({
    user, isHydrated, login, logout,
    staffAccounts, fetchStaff, addStaff, editStaff, deleteStaff,
    targetSettings, setTargetSettings,
    promotionSuggestions, fetchPromosi, addPromotion,
  }), [user, staffAccounts, targetSettings, promotionSuggestions, isHydrated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.warn('useAuth dipanggil di luar AuthProvider — mengembalikan nilai fallback.');
    return {
      user: null,
      isHydrated: false,
      login: async () => false,
      logout: () => {},
      staffAccounts: [],
      fetchStaff: () => {},
      addStaff: async () => {},
      editStaff: async () => {},
      deleteStaff: async () => {},
      targetSettings: { period: 'Belum diatur', omset: 0, sales: 0 },
      setTargetSettings: () => {},
      promotionSuggestions: [],
      fetchPromosi: () => {},
      addPromotion: async () => {},
    };
  }
  return ctx;
}