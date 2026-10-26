import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Footer } from '../common/Footer';
import { ShieldCheck, Eye, EyeOff, Lock, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { ADMIN_EMAIL } from '../../services/firebase';

interface AdminLoginProps {
  onBackToEmployeeLogin: () => void;
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onBackToEmployeeLogin,
  onSuccess 
}) => {
  const { signInAdmin, isLoading, error, clearError } = useAuth();
  
  // Both fields strictly initialize to empty strings to prevent any prefilling or browser autofill
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Guarantee password field is completely blank whenever component mounts / page opens
  useEffect(() => {
    setPassword('');
    setShowPassword(false);
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Require the user to manually enter both email and password
    if (!cleanEmail || !cleanPassword) {
      setLocalError('Invalid email or password.');
      return;
    }

    if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
      setLocalError('Invalid email or password.');
      return;
    }

    try {
      await signInAdmin(cleanEmail, cleanPassword);
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed.');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(130,104,244,0.18),rgba(255,255,255,0))] text-slate-100">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10">
          <BrandLogo size="md" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <a
            href="#"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault();
                onBackToEmployeeLogin();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
            title="Open Employee Portal (Click or Ctrl+Click to open in new tab)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Employee Portal</span>
          </a>
        </div>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-950/40 border border-red-900/30 p-8 md:p-10 relative overflow-hidden">
            {/* Top red glow stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-red-800" />

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3.5 bg-red-950/80 text-red-400 rounded-2xl mb-4 border border-red-800/50 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Admin Authentication
              </h1>
              <p className="text-xs text-slate-400 mt-2">
                Restricted portal for authorized Infyum administrative personnel only.
              </p>
            </div>

            {/* Authorized Admin Notice */}
            <div className="mb-6 p-3 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">
                Exclusive Admin: <strong className="text-white font-mono">{ADMIN_EMAIL}</strong>
              </span>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="mb-6 p-4 bg-red-950/70 border border-red-800 rounded-2xl flex items-start gap-3 text-red-200 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-300">Authentication Error</p>
                  <p className="mt-0.5 text-red-200">{displayError}</p>
                </div>
              </div>
            )}

            {/* Form with autoComplete="off" to disallow automatic submission/autofill */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              {/* Email */}
              <div>
                <label 
                  htmlFor="admin-email-input"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    id="admin-email-input"
                    name="admin_login_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="infyumtech@gmail.com"
                    autoComplete="off"
                    required
                    className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 focus:border-red-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label 
                  htmlFor="admin-password-input"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password-input"
                    name="admin_login_password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="new-password"
                    required
                    className="w-full px-4 py-3 pr-11 bg-slate-900/80 border border-slate-700 focus:border-red-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/30 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 hover:shadow-red-900/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In as Administrator'}</span>
              </button>
            </form>

            {/* Note on security */}
            <p className="text-[11px] text-slate-400 text-center mt-6 leading-relaxed">
              Protected by Firebase Authentication with server-side privilege validation. Unprivileged users will be redirected immediately.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
