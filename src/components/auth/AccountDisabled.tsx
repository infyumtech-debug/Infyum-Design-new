import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { Footer } from '../common/Footer';
import { ShieldX, LogOut, Mail } from 'lucide-react';
import { ADMIN_EMAIL } from '../../services/firebase';

export const AccountDisabled: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-red-700 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 text-center relative overflow-hidden">
          {/* Red disabled bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-red-800" />

          {/* Shield Disabled icon */}
          <div className="inline-flex items-center justify-center p-4 bg-red-50 text-red-700 rounded-2xl mb-5 border border-red-200">
            <ShieldX className="w-8 h-8 text-red-700" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Access Disabled
          </h2>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Your employee account for <strong className="text-slate-900 font-semibold">{user?.email}</strong> has been deactivated by the Administrator. Access to INFYUM DESIGN image tools is revoked.
          </p>

          {/* Contact Administrator info box */}
          <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-left">
            <Mail className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Appeal or Re-enable</p>
              <p className="mt-0.5">
                If you believe this is in error, please contact <span className="font-mono text-red-700 font-semibold">{ADMIN_EMAIL}</span> to request reinstatement.
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out to Employee Login</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};
