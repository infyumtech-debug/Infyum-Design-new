import React, { useState } from 'react';
import { 
  Search, 
  Check, 
  ShieldCheck, 
  ShieldOff, 
  Trash2, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import type { EmployeeUser, AccountStatus } from '../../types';

interface EmployeeTableProps {
  employees: EmployeeUser[];
  onApprove: (employee: EmployeeUser) => void;
  onReject: (employee: EmployeeUser) => void;
  onToggleTools: (employee: EmployeeUser, canUse: boolean) => void;
  onToggleStatus: (employee: EmployeeUser, newStatus: 'approved' | 'disabled') => void;
  onDelete: (employee: EmployeeUser) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onApprove,
  onReject,
  onToggleTools,
  onToggleStatus,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Top search and filter bar */}
      <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employees by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-red-600 rounded-xl focus:outline-hidden transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto">
          {(['all', 'pending', 'approved', 'disabled'] as const).map((status) => {
            const count = status === 'all' 
              ? employees.length 
              : employees.filter(e => e.status === status).length;
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-red-50 text-red-700 font-extrabold' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-6">Employee</th>
              <th className="py-3.5 px-6">Account Status</th>
              <th className="py-3.5 px-6">Image Tools Access</th>
              <th className="py-3.5 px-6">Last Login</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No employee records found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search or filter criteria.</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => {
                const isPending = emp.status === 'pending';
                const isDisabled = emp.status === 'disabled';
                const isApproved = emp.status === 'approved';

                return (
                  <tr key={emp.uid} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {emp.photoURL ? (
                          <img
                            src={emp.photoURL}
                            alt={emp.name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{emp.name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{emp.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {isDisabled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <ShieldOff className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </td>

                    {/* Tools Access Switch */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleTools(emp, !emp.canUseTools)}
                          disabled={isDisabled || isPending}
                          title={emp.canUseTools ? 'Click to revoke tool access' : 'Click to grant tool access'}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed ${
                            emp.canUseTools ? 'bg-red-700' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              emp.canUseTools ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[11px] font-semibold ${
                          emp.canUseTools ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                          {emp.canUseTools ? 'Active (All 3 Tools)' : 'Blocked'}
                        </span>
                      </div>
                    </td>

                    {/* Last Login Time */}
                    <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                      {formatDate(emp.lastLoginAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => onApprove(emp)}
                              title="Approve access"
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => onReject(emp)}
                              title="Reject request"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            {isDisabled ? (
                              <button
                                onClick={() => onToggleStatus(emp, 'approved')}
                                title="Re-enable account"
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ShieldCheck className="w-3 h-3" /> Enable
                              </button>
                            ) : (
                              <button
                                onClick={() => onToggleStatus(emp, 'disabled')}
                                title="Disable account"
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <ShieldOff className="w-3 h-3" /> Disable
                              </button>
                            )}

                            <button
                              onClick={() => onDelete(emp)}
                              title="Delete record"
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
