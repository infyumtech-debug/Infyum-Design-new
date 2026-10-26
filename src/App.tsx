import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EmployeeLogin } from './components/auth/EmployeeLogin';
import { AdminLogin } from './components/auth/AdminLogin';
import { PendingApproval } from './components/auth/PendingApproval';
import { AccountDisabled } from './components/auth/AccountDisabled';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ShieldAlert, X } from 'lucide-react';
import { ThemeProvider } from './context/ThemeProvider';

const MainApp: React.FC = () => {
  const { 
    adminUser, 
    employeeUser, 
    employeeProfile, 
    isAdmin, 
    isApproved, 
    canUseTools, 
    isAdminLoading, 
    isEmployeeLoading 
  } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<'admin' | 'employee'>(() => {
    if (typeof window === 'undefined') return 'employee';
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return (hash.includes('admin') || path.includes('admin')) ? 'admin' : 'employee';
  });

  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);

  // Sync route on hash changes across tabs / history
  useEffect(() => {
    const handleNavigationCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const isAdminRoute = hash.includes('admin') || path.includes('admin');

      if (isAdminRoute) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('employee');
      }
    };

    handleNavigationCheck();
    window.addEventListener('hashchange', handleNavigationCheck);
    return () => window.removeEventListener('hashchange', handleNavigationCheck);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = 'admin';
    setCurrentRoute('admin');
  };

  const navigateToEmployee = () => {
    window.location.hash = '';
    setCurrentRoute('employee');
  };

  // 1. Loading state for the active tab context
  const isCurrentLoading = currentRoute === 'admin' ? isAdminLoading : isEmployeeLoading;

  if (isCurrentLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-4 border-red-200 border-t-red-700 animate-spin" />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
          Loading INFYUM DESIGN...
        </p>
      </div>
    );
  }

  // 2. ADMIN PORTAL ROUTE (Dedicated, isolated admin session context)
  if (currentRoute === 'admin') {
    // If admin is authenticated with verified credentials and role in Firestore
    if (isAdmin && (adminUser || employeeUser)) {
      return <AdminDashboard onNavigateToStudio={navigateToEmployee} />;
    }

    // Otherwise show Admin Login
    return (
      <AdminLogin
        onBackToEmployeeLogin={navigateToEmployee}
        onSuccess={() => {}}
      />
    );
  }

  // 3. EMPLOYEE PORTAL ROUTE (Dedicated employee session context)
  if (!employeeUser && !adminUser) {
    return <EmployeeLogin onNavigateToAdmin={navigateToAdmin} />;
  }

  // If Admin is logged in, show Employee Dashboard directly with full privileges
  if (isAdmin) {
    return <EmployeeDashboard />;
  }

  // Employee is authenticated
  return (
    <>
      {/* Banner if access denied notice is active */}
      {accessDeniedNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-950 text-red-100 p-4 rounded-2xl shadow-2xl border border-red-800 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-white">Security Notice</p>
              <p className="mt-0.5 text-red-200">{accessDeniedNotice}</p>
            </div>
            <button
              onClick={() => setAccessDeniedNotice(null)}
              className="text-red-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Account Disabled */}
      {employeeProfile?.status === 'disabled' && <AccountDisabled />}

      {/* Account Pending Approval */}
      {(!isApproved || employeeProfile?.status === 'pending') && employeeProfile?.status !== 'disabled' && (
        <PendingApproval />
      )}

      {/* Approved with Tool Access: Show Employee Dashboard */}
      {canUseTools && isApproved && employeeProfile?.status === 'approved' && (
        <EmployeeDashboard />
      )}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
