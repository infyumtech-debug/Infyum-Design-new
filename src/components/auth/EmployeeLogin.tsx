import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { Footer } from '../common/Footer';
import infyumMark from '../../assets/infyum-mark.png';
import { Shield, ArrowRight, Lock, AlertCircle, Mail, User, KeyRound } from 'lucide-react';

interface EmployeeLoginProps {
  onNavigateToAdmin: () => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onNavigateToAdmin }) => {
  const { 
    signInWithGoogle, 
    signInEmployeeWithEmail, 
    signUpEmployeeWithEmail,
    isLoading, 
    error, 
    clearError 
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      await signInWithGoogle();
    } catch {
      // Error handled by AuthContext
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      if (isRegisterMode) {
        await signUpEmployeeWithEmail(email.trim(), password.trim(), name.trim());
      } else {
        await signInEmployeeWithEmail(email.trim(), password.trim());
      }
    } catch {
      // Handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950">
      {/* Top Banner / Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <a
            href="#admin"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault();
                onNavigateToAdmin();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white/80 hover:bg-red-50 hover:text-red-800 border border-slate-200/80 hover:border-red-200 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Open Admin Portal (Click or Ctrl+Click to open in new tab)"
          >
            <Lock className="w-3.5 h-3.5 text-red-700" />
            <span>Admin Portal</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-800 via-red-600 to-red-900" />

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-slate-900 border border-slate-700/70 shadow-lg shadow-slate-950/20 mb-4 p-1.5">
                <img src={infyumMark} alt="INFYUM DESIGN logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Infyum Employee Workspace
              </h1>
              <p className="text-xs text-slate-500 mt-2">
                Sign in with Google or your employee email (work or personal) to access Design Studio & AI Tools.
              </p>
            </div>

            {/* Auth Method Selector */}
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setAuthMethod('google'); clearError(); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMethod === 'google'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Google Sign-In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); clearError(); }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  authMethod === 'email'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Email & Password
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Notice</p>
                  <p className="mt-0.5 text-red-700 leading-relaxed whitespace-pre-line">{error}</p>
                  {error.includes('Register') && !isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('email');
                        setIsRegisterMode(true);
                        clearError();
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      <span>Register This Account Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Method 1: Google Sign In */}
            {authMethod === 'google' && (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-semibold rounded-2xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {/* Google Icon */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm font-bold">
                    {isLoading ? 'Connecting...' : 'Sign in with Google'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}

            {/* Method 2: Email & Password Form */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {/* Sign-In vs Register Sub-Tab */}
                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(false); clearError(); }}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      !isRegisterMode
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(true); clearError(); }}
                    className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isRegisterMode
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Register (New Employee)
                  </button>
                </div>

                <div className="text-[11px] text-slate-500">
                  {isRegisterMode 
                    ? 'Enter your name, personal email (e.g. @gmail.com) or work email, and a password.' 
                    : 'Sign in with your personal or work email and password.'}
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-red-600 focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="font-normal text-slate-400">(personal or corporate)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. personal@gmail.com or work@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-red-600 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-red-600 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : isRegisterMode ? 'Register Employee Account' : 'Sign In'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsRegisterMode(!isRegisterMode); clearError(); }}
                    className="text-xs text-red-700 hover:text-red-900 font-semibold cursor-pointer underline"
                  >
                    {isRegisterMode ? 'Already registered? Click here to Sign In' : "First time logging in? Click here to Register"}
                  </button>
                </div>
              </form>
            )}

            {/* Security info box */}
            <div className="mt-6 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-left">
              <Shield className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed">
                Access is strictly verified against the Infyum employee database. Newly registered accounts require Admin approval before Design Studio & AI Tools are unlocked.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
