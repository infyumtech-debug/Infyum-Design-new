export type UserRole = 'admin' | 'employee';

export type AccountStatus = 'pending' | 'approved' | 'disabled';

export interface EmployeeUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  status: AccountStatus;
  isApproved: boolean;
  canUseTools: boolean;
  createdAt: string; // ISO string or timestamp string
  lastLoginAt: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export interface LoginActivity {
  id?: string;
  uid: string;
  email: string;
  eventType: 'login' | 'logout' | 'register_pending' | 'admin_login';
  timestamp: string;
}

export interface AccessAuditLog {
  id?: string;
  changedBy: string; // Admin email/uid
  employeeUid: string;
  employeeEmail: string;
  action: 'approved' | 'rejected' | 'disabled' | 'enabled' | 'tools_granted' | 'tools_revoked' | 'deleted';
  timestamp: string;
  details?: string;
}

export type ToolType = 'studio' | 'bg-remover';

export * from './design';
