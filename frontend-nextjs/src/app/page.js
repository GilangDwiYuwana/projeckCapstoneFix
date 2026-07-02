import Link from 'next/link';
import { ArrowRight, Bike, LineChart, Database } from 'lucide-react'; // Menggunakan ikon untuk kesan HD

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden font-sans">
      
      {/* ================= BACKGROUND ELEMENTS (HD TEXTURE) ================= */}
      {/* 1. Subtle Radial Gradient Glow */}
      <div className="absolute top-0 left-1/4 w-full h-[1000px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100/40 via-transparent to-transparent -z-10" />
      
      {/* 2. Micro Dotted Pattern for technical feel */}
      <div className="absolute inset-0 z-[-5] opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      {/* 3. Large Decorative Ghost Icon */}
      <Bike className="absolute -bottom-20 -left-20 h-[500px] w-[500px] text-red-100/30 rotate-[-15deg] -z-10" />


      {/* ================= MAIN CONTAINER (SPLIT LAYOUT) ================= */}
      <div className="max-w-7xl w-full grid md:grid-cols-12 gap-0 overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-[0_25px_80px_-15px_rgba(15,23,42,0.15)] backdrop-blur-sm">
        
        {/* === LEFT SIDE: Content & Action === */}
        <div className="md:col-span-7 p-8 md:p-16 flex flex-col justify-center space-y-10">
          
          {/* Badge & Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20">
              H
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">
              Honda Internal Systems
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-950 tracking-tighter leading-[0.95]">
              Analisis Prediksi & Manajemen <span className="text-red-600">Master Data</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl pt-2 font-medium">
              Selamat datang kembali. Tingkatkan efisiensi operasional dengan portal terpusat untuk pengelolaan unit motor dan kalkulasi prediksi stok yang akurat.
            </p>
          </div>

          {/* Enhanced CTA Button */}
          <div className="pt-6">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-red-600/30 transition-all duration-300 hover:bg-red-700 hover:-translate-y-1 hover:shadow-red-700/40"
            >
              Masuk ke Portal Sistem
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </div>

        {/* === RIGHT SIDE: Visual Feature Highlights === */}
        <div className="md:col-span-5 bg-slate-50/50 p-8 md:p-12 border-l border-slate-100 flex flex-col justify-center space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Fitur Utama Sistem</h3>
          
          {/* Feature Card 1 */}
          <div className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-red-100">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Sentralisasi Master Data</h4>
              <p className="text-sm text-slate-600 mt-1">Kelola seluruh informasi unit motor Honda secara terstruktur dan real-time.</p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-red-100">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <LineChart className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-lg">Kalkulasi Prediksi Akurat</h4>
              <p className="text-sm text-slate-600 mt-1">Gunakan engine kalkulasi untuk memprediksi kebutuhan stok berdasarkan histori data.</p>
            </div>
          </div>
          
          <div className="text-xs text-slate-400 pt-4 text-center">
            Diprakarsai oleh Departemen IT - Honda Motor Indonesia
          </div>
        </div>
        
      </div>

      {/* Footer minimalis */}
      <div className="mt-10 text-sm text-slate-500 font-medium">
        &copy; 2024 XGBoost Engine Project. All Rights Reserved.
      </div>
    </div>
  );
}