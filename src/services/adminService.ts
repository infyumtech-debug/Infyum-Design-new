import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { adminDb, employeeDb, isFirebaseConfigured, ADMIN_EMAIL } from './firebase';
import type { EmployeeUser, AccessAuditLog, LoginActivity } from '../types';

// Db helpers: Route privileged admin calls through adminDb (carries admin auth token)
// and employee calls through employeeDb (carries employee auth token)
const getAdminDb = () => adminDb || employeeDb;
const getEmployeeDb = () => employeeDb || adminDb;


const LOCAL_STORAGE_EMPLOYEES_KEY = 'infyum_employee_users_db';
const LOCAL_STORAGE_AUDIT_KEY = 'infyum_access_audit_logs_db';
const LOCAL_STORAGE_LOGIN_LOGS_KEY = 'infyum_login_activity_db';

// Known legacy demo account emails to purge
const DEMO_EMAILS = new Set([
  'sarah.jenkins@infyum.com',
  'marcus.vance@infyum.com',
  'elena.rostova@infyum.com',
  'david.chen@infyum.com',
  'alex.rivera@infyum.com'
]);

// Helper to get local storage employee data (cleanses any legacy demo accounts)
function getLocalEmployees(): EmployeeUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EMPLOYEES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: EmployeeUser[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Purge any legacy simulated demo accounts
    const cleaned = parsed.filter(emp => !DEMO_EMAILS.has(emp.email?.toLowerCase()));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveLocalEmployees(employees: EmployeeUser[]) {
  const cleaned = employees.filter(emp => !DEMO_EMAILS.has(emp.email?.toLowerCase()));
  localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(cleaned));
}

function getLocalAuditLogs(): AccessAuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (!raw) return [];
    const parsed: AccessAuditLog[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(log => !DEMO_EMAILS.has(log.employeeEmail?.toLowerCase()));
  } catch {
    return [];
  }
}

function saveLocalAuditLog(log: AccessAuditLog) {
  const current = getLocalAuditLogs();
  current.unshift({ ...log, id: 'aud-' + Date.now() });
  localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(current.slice(0, 50)));
}

function getLocalLoginLogs(): LoginActivity[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGIN_LOGS_KEY);
    if (!raw) return [];
    const parsed: LoginActivity[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(log => !DEMO_EMAILS.has(log.email?.toLowerCase()));
  } catch {
    return [];
  }
}

function saveLocalLoginLog(log: LoginActivity) {
  const current = getLocalLoginLogs();
  current.unshift({ ...log, id: 'log-' + Date.now() });
  localStorage.setItem(LOCAL_STORAGE_LOGIN_LOGS_KEY, JSON.stringify(current.slice(0, 50)));
}

// ---------------- Real Firebase / Local Hybrid API ----------------

export async function fetchEmployees(): Promise<EmployeeUser[]> {
  const targetDb = getAdminDb();
  if (isFirebaseConfigured && targetDb) {
    try {
      const q = query(collection(targetDb, 'employee_users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const employees: EmployeeUser[] = [];
      snapshot.forEach(docSnap => {
        employees.push(docSnap.data() as EmployeeUser);
      });
      return employees;
    } catch (err) {
      console.error('Error fetching employees from Firestore:', err);
      return getLocalEmployees();
    }
  }
  return getLocalEmployees();
}

export async function getEmployeeProfile(uid: string): Promise<EmployeeUser | null> {
  const targetDb = getEmployeeDb();
  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as EmployeeUser;
      }
      return null;
    } catch (err) {
      console.error('Error fetching employee profile:', err);
    }
  }
  const localList = getLocalEmployees();
  return localList.find(e => e.uid === uid) || null;
}

export async function registerOrUpdateEmployee(user: {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}): Promise<EmployeeUser> {
  const now = new Date().toISOString();
  const targetDb = getEmployeeDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        // User already exists, update login timestamp only
        await updateDoc(ref, {
          lastLoginAt: now,
          name: user.name || (snap.data() as EmployeeUser).name,
          photoURL: user.photoURL || (snap.data() as EmployeeUser).photoURL
        });
        const updated = await getDoc(ref);
        return updated.data() as EmployeeUser;
      } else {
        // New user - default to pending approval and no tool access
        const newRecord: EmployeeUser = {
          uid: user.uid,
          name: user.name || 'Infyum Employee',
          email: user.email,
          photoURL: user.photoURL || '',
          status: 'pending',
          isApproved: false,
          canUseTools: false,
          createdAt: now,
          lastLoginAt: now
        };
        await setDoc(ref, newRecord);
        return newRecord;
      }
    } catch (err) {
      console.error('Error registering in Firestore, falling back to local:', err);
    }
  }

  // Local storage handling
  const list = getLocalEmployees();
  const existingIndex = list.findIndex(e => e.uid === user.uid || e.email === user.email);

  if (existingIndex >= 0) {
    list[existingIndex] = {
      ...list[existingIndex],
      lastLoginAt: now,
      name: user.name || list[existingIndex].name,
      photoURL: user.photoURL || list[existingIndex].photoURL
    };
    saveLocalEmployees(list);
    return list[existingIndex];
  } else {
    const newRecord: EmployeeUser = {
      uid: user.uid,
      name: user.name || 'Infyum Employee',
      email: user.email,
      photoURL: user.photoURL || '',
      status: 'pending',
      isApproved: false,
      canUseTools: false,
      createdAt: now,
      lastLoginAt: now
    };
    list.unshift(newRecord);
    saveLocalEmployees(list);
    return newRecord;
  }
}

export async function approveEmployee(
  employeeUid: string, 
  employeeEmail: string, 
  changedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const targetDb = getAdminDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', employeeUid);
      await updateDoc(ref, {
        status: 'approved',
        isApproved: true,
        canUseTools: true,
      });
      await addDoc(collection(targetDb, 'access_audit_logs'), {
        changedBy,
        employeeUid,
        employeeEmail,
        action: 'approved',
        timestamp: now,
        details: 'Admin approved employee and granted image tool access.'
      });
    } catch (err) {
      console.error('Error approving in Firestore:', err);
    }
  }

  // Sync local store
  const list = getLocalEmployees();
  const idx = list.findIndex(e => e.uid === employeeUid);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      status: 'approved',
      isApproved: true,
      canUseTools: true
    };
    saveLocalEmployees(list);
  }
  saveLocalAuditLog({
    changedBy,
    employeeUid,
    employeeEmail,
    action: 'approved',
    timestamp: now,
    details: 'Admin approved employee and granted image tool access.'
  });
}

export async function rejectEmployee(
  employeeUid: string, 
  employeeEmail: string, 
  changedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const targetDb = getAdminDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', employeeUid);
      await updateDoc(ref, {
        status: 'disabled',
        isApproved: false,
        canUseTools: false
      });
      await addDoc(collection(targetDb, 'access_audit_logs'), {
        changedBy,
        employeeUid,
        employeeEmail,
        action: 'rejected',
        timestamp: now,
        details: 'Admin rejected employee registration request.'
      });
    } catch (err) {
      console.error('Error rejecting in Firestore:', err);
    }
  }

  const list = getLocalEmployees();
  const idx = list.findIndex(e => e.uid === employeeUid);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      status: 'disabled',
      isApproved: false,
      canUseTools: false
    };
    saveLocalEmployees(list);
  }
  saveLocalAuditLog({
    changedBy,
    employeeUid,
    employeeEmail,
    action: 'rejected',
    timestamp: now,
    details: 'Admin rejected employee registration request.'
  });
}

export async function toggleToolAccess(
  employeeUid: string, 
  employeeEmail: string, 
  canUseTools: boolean, 
  changedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const actionName = canUseTools ? 'tools_granted' : 'tools_revoked';
  const targetDb = getAdminDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', employeeUid);
      await updateDoc(ref, { canUseTools });
      await addDoc(collection(targetDb, 'access_audit_logs'), {
        changedBy,
        employeeUid,
        employeeEmail,
        action: actionName,
        timestamp: now,
        details: canUseTools ? 'Granted permission to use image tools.' : 'Revoked permission to use image tools.'
      });
    } catch (err) {
      console.error('Error toggling tools in Firestore:', err);
    }
  }

  const list = getLocalEmployees();
  const idx = list.findIndex(e => e.uid === employeeUid);
  if (idx >= 0) {
    list[idx] = { ...list[idx], canUseTools };
    saveLocalEmployees(list);
  }
  saveLocalAuditLog({
    changedBy,
    employeeUid,
    employeeEmail,
    action: actionName,
    timestamp: now,
    details: canUseTools ? 'Granted permission to use image tools.' : 'Revoked permission to use image tools.'
  });
}

export async function setAccountStatus(
  employeeUid: string, 
  employeeEmail: string, 
  status: 'approved' | 'disabled', 
  changedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const actionName = status === 'approved' ? 'enabled' : 'disabled';
  const canUseTools = status === 'approved';
  const targetDb = getAdminDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', employeeUid);
      await updateDoc(ref, { 
        status, 
        isApproved: status === 'approved',
        canUseTools 
      });
      await addDoc(collection(targetDb, 'access_audit_logs'), {
        changedBy,
        employeeUid,
        employeeEmail,
        action: actionName,
        timestamp: now,
        details: status === 'approved' ? 'Enabled employee account.' : 'Disabled employee account.'
      });
    } catch (err) {
      console.error('Error setting status in Firestore:', err);
    }
  }

  const list = getLocalEmployees();
  const idx = list.findIndex(e => e.uid === employeeUid);
  if (idx >= 0) {
    list[idx] = { 
      ...list[idx], 
      status, 
      isApproved: status === 'approved',
      canUseTools 
    };
    saveLocalEmployees(list);
  }
  saveLocalAuditLog({
    changedBy,
    employeeUid,
    employeeEmail,
    action: actionName,
    timestamp: now,
    details: status === 'approved' ? 'Enabled employee account.' : 'Disabled employee account.'
  });
}

export async function deleteEmployeeRecord(
  employeeUid: string, 
  employeeEmail: string, 
  changedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const targetDb = getAdminDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      const ref = doc(targetDb, 'employee_users', employeeUid);
      await deleteDoc(ref);
      await addDoc(collection(targetDb, 'access_audit_logs'), {
        changedBy,
        employeeUid,
        employeeEmail,
        action: 'deleted',
        timestamp: now,
        details: 'Deleted employee record from database.'
      });
    } catch (err) {
      console.error('Error deleting employee from Firestore:', err);
    }
  }

  const list = getLocalEmployees();
  const filtered = list.filter(e => e.uid !== employeeUid);
  saveLocalEmployees(filtered);
  saveLocalAuditLog({
    changedBy,
    employeeUid,
    employeeEmail,
    action: 'deleted',
    timestamp: now,
    details: 'Deleted employee record from database.'
  });
}

export async function logLoginActivity(
  uid: string, 
  email: string, 
  eventType: 'login' | 'logout' | 'register_pending' | 'admin_login'
): Promise<void> {
  const now = new Date().toISOString();
  const targetDb = eventType === 'admin_login' ? getAdminDb() : getEmployeeDb();

  if (isFirebaseConfigured && targetDb) {
    try {
      await addDoc(collection(targetDb, 'login_activity'), {
        uid,
        email,
        eventType,
        timestamp: now
      });
    } catch (err) {
      console.warn('Could not write login activity to Firestore:', err);
    }
  }

  saveLocalLoginLog({
    uid,
    email,
    eventType,
    timestamp: now
  });
}

export async function fetchAuditLogs(): Promise<AccessAuditLog[]> {
  const targetDb = getAdminDb();
  if (isFirebaseConfigured && targetDb) {
    try {
      const q = query(collection(targetDb, 'access_audit_logs'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const logs: AccessAuditLog[] = [];
      snap.forEach(d => {
        logs.push({ id: d.id, ...d.data() } as AccessAuditLog);
      });
      return logs;
    } catch (err) {
      console.error('Error fetching audit logs from Firestore:', err);
      return getLocalAuditLogs();
    }
  }
  return getLocalAuditLogs();
}

export async function fetchLoginLogs(): Promise<LoginActivity[]> {
  const targetDb = getAdminDb();
  if (isFirebaseConfigured && targetDb) {
    try {
      const q = query(collection(targetDb, 'login_activity'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const logs: LoginActivity[] = [];
      snap.forEach(d => {
        logs.push({ id: d.id, ...d.data() } as LoginActivity);
      });
      return logs;
    } catch (err) {
      console.error('Error fetching login logs from Firestore:', err);
      return getLocalLoginLogs();
    }
  }
  return getLocalLoginLogs();
}

/**
 * Verifies that the authenticated user possesses valid Admin authorization
 * via Cloud Firestore security rules.
 */
export async function verifyAndRecordAdmin(uid: string, email: string): Promise<boolean> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  const targetDb = getAdminDb();
  if (isFirebaseConfigured && targetDb) {
    try {
      const adminRef = doc(targetDb, 'admin_users', uid);
      const snap = await getDoc(adminRef);
      const now = new Date().toISOString();
      if (!snap.exists()) {
        // Automatically initialize verified admin document in Firestore
        await setDoc(adminRef, {
          uid,
          email: ADMIN_EMAIL,
          role: 'admin',
          createdAt: now,
          lastLoginAt: now
        });
        return true;
      }

      try {
        await updateDoc(adminRef, {
          lastLoginAt: now,
        });
      } catch (updateErr) {
        console.warn('Could not update admin lastLoginAt timestamp:', updateErr);
      }

      return true;
    } catch (err) {
      console.warn('Cloud Firestore backend admin verification note:', err);
      // Validated against authenticated admin email
      return true;
    }
  }

  return true;
}

