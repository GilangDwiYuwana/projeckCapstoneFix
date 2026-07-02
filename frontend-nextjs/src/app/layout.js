import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'XGBoost Engine - Honda',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-600 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}