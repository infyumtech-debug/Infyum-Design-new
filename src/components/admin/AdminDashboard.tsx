import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { Footer } from '../common/Footer';
import { StatCard } from './StatCard';
import { EmployeeTable } from './EmployeeTable';
import { AuditLogModal } from './AuditLogModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { 
  fetchEmployees, 
  approveEmployee, 
  rejectEmployee, 
  toggleToolAccess, 
  setAccountStatus, 
  deleteEmployeeRecord,
  fetchAuditLogs,
  fetchLoginLogs 
} from '../../services/adminService';
import { ADMIN_EMAIL } from '../../services/firebase';
import type { EmployeeUser, AccessAuditLog, LoginActivity } from '../../types';
import { 
  Users, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  LogOut, 
  RefreshCw, 
  Shield, 
  History,
  Lock,
  CheckCircle2,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  onNavigateToStudio?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToStudio }) => {
  const { user, adminLogout } = useAuth();
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AccessAuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginActivity[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modals state
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'primary';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    variant: 'danger',
    action: async () => {},
  });
// Test
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [empList, audits, logins] = await Promise.all([
        fetchEmployees(),
        fetchAuditLogs(),
        fetchLoginLogs(),
      ]);
      setEmployees(empList);
      setAuditLogs(audits);
      setLoginLogs(logins);
    } catch (err) {
      console.error('Error loading admin records:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
    showNotice('Database records synchronized', 'info');
  };

  const showNotice = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackNotice({ message, type });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // 1. Approve Employee
  const handleApprove = async (emp: EmployeeUser) => {
    try {
      await approveEmployee(emp.uid, emp.email, user?.email || ADMIN_EMAIL);
      await loadAllData();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#ffffff']
      });
      showNotice(`Approved ${emp.name} — Image tool access granted.`);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Reject Employee
  const handleReject = (emp: EmployeeUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Employee Request?',
      message: `Are you sure you want to reject access request for ${emp.name} (${emp.email})?`,
      confirmLabel: 'Reject Request',
      variant: 'danger',
      action: async () => {
        await rejectEmployee(emp.uid, emp.email, user?.email || ADMIN_EMAIL);
        await loadAllData();
        showNotice(`Rejected access request for ${emp.email}`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 3. Toggle Tool Access
  const handleToggleTools = async (emp: EmployeeUser, canUse: boolean) => {
    try {
      await toggleToolAccess(emp.uid, emp.email, canUse, user?.email || ADMIN_EMAIL);
      await loadAllData();
      showNotice(`${canUse ? 'Granted' : 'Revoked'} image tool access for ${emp.name}.`);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Toggle Account Status (Disable / Enable)
  const handleToggleStatus = (emp: EmployeeUser, newStatus: 'approved' | 'disabled') => {
    if (newStatus === 'disabled') {
      setConfirmDialog({
        isOpen: true,
        title: 'Deactivate Employee Account?',
        message: `Deactivating ${emp.name}'s account will immediately revoke all image tool access and block login sessions.`,
        confirmLabel: 'Deactivate Account',
        variant: 'danger',
        action: async () => {
          await setAccountStatus(emp.uid, emp.email, 'disabled', user?.email || ADMIN_EMAIL);
          await loadAllData();
          showNotice(`Deactivated account for ${emp.name}`);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      setAccountStatus(emp.uid, emp.email, 'approved', user?.email || ADMIN_EMAIL).then(() => {
        loadAllData();
        showNotice(`Re-enabled account for ${emp.name}`);
      });
    }
  };

  // 5. Delete Employee Record
  const handleDelete = (emp: EmployeeUser) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Employee Record?',
      message: `Permanently delete the database record for ${emp.name} (${emp.email})? This action is audited.`,
      confirmLabel: 'Delete Permanently',
      variant: 'danger',
      action: async () => {
        await deleteEmployeeRecord(emp.uid, emp.email, user?.email || ADMIN_EMAIL);
        await loadAllData();
        showNotice(`Deleted record for ${emp.email}`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Calculate Dashboard Statistics
  const totalEmployees = employees.length;
  const pendingEmployees = employees.filter(e => e.status === 'pending').length;
  const approvedEmployees = employees.filter(e => e.status === 'approved').length;
  const disabledEmployees = employees.filter(e => e.status === 'disabled').length;
  const activeToolUsers = employees.filter(e => e.isApproved && e.canUseTools && e.status === 'approved').length;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-red-900/40 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <BrandLogo size="md" />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-red-400" /> Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin identity badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-300">Signed in:</span>
              <span className="font-mono font-bold text-white">{ADMIN_EMAIL}</span>
            </div>

            {/* Design Studio & Tools button */}
            <a
              href="#"
              onClick={(e) => {
                if (onNavigateToStudio) {
                  e.preventDefault();
                  onNavigateToStudio();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Open Design Studio & AI Tools"
            >
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Design Studio & Tools</span>
            </a>

            {/* Audit Logs button */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audit Logs</span>
            </button>

            {/* Refresh */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Refresh database records"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={adminLogout}
              title="Sign Out of Admin Console"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Floating feedback notification toast */}
        {feedbackNotice && (
          <div className="p-4 bg-emerald-900 text-emerald-100 rounded-2xl shadow-xl flex items-center gap-3 text-xs border border-emerald-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{feedbackNotice.message}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Employee Access Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure employee authorization, review access requests, and oversee INFYUM DESIGN tool privileges.
            </p>
          </div>

          {pendingEmployees > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs font-bold self-start sm:self-auto animate-pulse">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{pendingEmployees} Pending Request{pendingEmployees > 1 ? 's' : ''} Require Approval</span>
            </div>
          )}
        </div>

        {/* Metric Cards Grid - Exactly covers: Total, Active, Approved, Pending, Disabled */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Registered"
            value={totalEmployees}
            subtitle="All employee accounts"
            icon={<Users className="w-5 h-5" />}
            badge="Directory"
            badgeColor="slate"
          />

          <StatCard
            title="Active Employees"
            value={activeToolUsers}
            subtitle="Active & tool enabled"
            icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
            badge="Permitted"
            badgeColor="emerald"
          />

          <StatCard
            title="Approved Accounts"
            value={approvedEmployees}
            subtitle="Admin verified"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            badge="Verified"
            badgeColor="emerald"
          />

          <StatCard
            title="Pending Approval"
            value={pendingEmployees}
            subtitle="Awaiting review"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            badge={pendingEmployees > 0 ? "Action Required" : "None"}
            badgeColor={pendingEmployees > 0 ? "amber" : "emerald"}
          />

          <StatCard
            title="Disabled Accounts"
            value={disabledEmployees}
            subtitle="Access revoked"
            icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
            badge={disabledEmployees > 0 ? "Restricted" : "Zero"}
            badgeColor={disabledEmployees > 0 ? "red" : "slate"}
          />
        </div>

        {/* Employee Access Management Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Employee Directory & Permission Controls</span>
              <span className="text-xs font-normal text-slate-400">
                {isLoadingData ? '(Loading records...)' : `(${employees.length} accounts)`}
              </span>
            </h2>
          </div>

          <EmployeeTable
            employees={employees}
            onApprove={handleApprove}
            onReject={handleReject}
            onToggleTools={handleToggleTools}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        auditLogs={auditLogs}
        loginLogs={loginLogs}
      />

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <Footer />
    </div>
  );
};
