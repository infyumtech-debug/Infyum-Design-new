import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { Footer } from '../common/Footer';
import { Clock, RefreshCw, LogOut, Mail } from 'lucide-react';
import { ADMIN_EMAIL } from '../../services/firebase';

export const PendingApproval: React.FC = () => {
  const { user, refreshProfile, logout, isLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setTimeout(() => setIsRefreshing(false), 600);
  };

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
          {/* Amber pending bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          {/* Animated clock badge */}
          <div className="inline-flex items-center justify-center p-4 bg-amber-50 text-amber-600 rounded-2xl mb-5 border border-amber-200/80">
            <Clock className="w-8 h-8 animate-pulse text-amber-600" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Awaiting Approval
          </h2>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Your employee account <strong className="text-slate-900 font-semibold">{user?.email}</strong> is registered, but requires verification from an Infyum Administrator before tool access can be granted.
          </p>

          {/* User detail pill */}
          <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'E'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{user?.displayName || 'Infyum Employee'}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-100/80 border border-amber-200 rounded-full">
              Pending Review
            </span>
          </div>

          {/* Admin Contact info */}
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 flex items-start gap-3 text-left mb-6">
            <Mail className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <p className="font-semibold text-red-900">Need immediate access?</p>
              <p className="mt-0.5 text-slate-600">
                Please contact the administrator at <strong className="text-red-800 font-mono">{ADMIN_EMAIL}</strong> to approve your workspace request.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md shadow-red-900/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>
            <button
              onClick={logout}
              className="w-full sm:w-auto px-5 py-3 text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
