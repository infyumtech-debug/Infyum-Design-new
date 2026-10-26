import React, { useState } from 'react';
import { X, ShieldAlert, Activity } from 'lucide-react';
import type { AccessAuditLog, LoginActivity } from '../../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AccessAuditLog[];
  loginLogs: LoginActivity[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  loginLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'login'>('audit');

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'rejected':
      case 'disabled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Disabled</span>;
      case 'tools_granted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Tools Granted</span>;
      case 'tools_revoked':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Tools Revoked</span>;
      case 'deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Deleted</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Security & Audit Records</h3>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions and session events.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'audit'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Admin Action Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`py-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'login'
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            User Login Activity ({loginLogs.length})
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === 'audit' ? (
            auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No administrative actions logged yet.
              </div>
            ) : (
              auditLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="font-bold text-slate-900">{log.employeeEmail}</span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-slate-500">{log.details}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {formatDate(log.timestamp)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      By: {log.changedBy}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            loginLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No login activities recorded yet.
              </div>
            ) : (
              loginLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{log.email}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {log.eventType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
