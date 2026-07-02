"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RoleGuard({ children, allowedRoles = ['owner', 'staff'] }) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    if (user) {
      setStoredUser(user);
      return;
    }

    if (typeof window === 'undefined') return;

    const savedUser = window.localStorage.getItem('honda-user');
    if (savedUser) {
      try {
        setStoredUser(JSON.parse(savedUser));
      } catch {
        setStoredUser(null);
      }
    } else {
      setStoredUser(null);
    }
  }, [user]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user && !storedUser) {
      router.replace('/login');
    }
  }, [router, user, storedUser, isHydrated]);

  const currentUser = user || storedUser;

  if (!isHydrated) return null;
  if (!currentUser) return null;

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
        Anda tidak punya akses ke halaman ini.
      </div>
    );
  }

  return children;
}
