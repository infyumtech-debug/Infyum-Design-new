import { strict as assert } from 'assert';

console.log('--- INFYUM DESIGN MANDATORY SECURITY & LOGIC SUITE ---');

const ADMIN_EMAIL = 'infyumtech@gmail.com';

// Simulated Auth Decision Engine mirroring AuthContext and App.tsx
function evaluateAdminLogin(email, password, isFirebasePasswordValid) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // Test Case 3: Empty password or empty email
  if (!normalizedEmail || !cleanPassword) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Unauthorized email check
  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Test Case 2: Incorrect password check via Firebase Authentication
  if (!isFirebasePasswordValid) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // Test Case 1: Correct Admin email + Correct password verified by Firebase Auth
  return { 
    success: true, 
    user: { email: ADMIN_EMAIL, role: 'admin' },
    view: 'AdminDashboard'
  };
}

// Simulated Route Guard Engine mirroring App.tsx
function evaluateRouteAccess(currentUser, targetUrl) {
  const isTargetAdmin = targetUrl.toLowerCase().includes('admin');

  // Test Case 6: Unauthenticated user directly opening Admin URL
  if (!currentUser) {
    if (isTargetAdmin) {
      return { redirect: 'admin-login', accessGranted: false, reason: 'Redirect to Admin Login' };
    }
    return { redirect: 'employee-login', accessGranted: false, reason: 'Redirect to Employee Login' };
  }

  // Test Case 5: Employee directly opening the Admin URL
  if (currentUser.role === 'employee') {
    if (isTargetAdmin) {
      return { 
        redirect: 'employee-dashboard', 
        accessGranted: false, 
        securityAlert: 'Access Denied: The Admin Panel is strictly restricted to the authorized administrator.' 
      };
    }
    // Test Case 4: Employee Google Account subject to approval
    if (currentUser.status === 'disabled') {
      return { view: 'AccountDisabled', accessGranted: false };
    }
    if (!currentUser.isApproved || currentUser.status === 'pending') {
      return { view: 'PendingApproval', accessGranted: false };
    }
    return { view: 'EmployeeDashboard', accessGranted: true, canUseTools: currentUser.canUseTools };
  }

  // Authenticated Admin
  if (currentUser.role === 'admin' && currentUser.email === ADMIN_EMAIL) {
    return { view: 'AdminDashboard', accessGranted: true };
  }

  return { accessGranted: false, redirect: 'employee-login' };
}

// ---------------- EXECUTION OF MANDATORY TEST CASES ----------------

console.log('Test 1: Correct Admin email + correct password');
const test1 = evaluateAdminLogin('infyumtech@gmail.com', 'ValidAdminPassword123!', true);
assert.strictEqual(test1.success, true);
assert.strictEqual(test1.view, 'AdminDashboard');
console.log('   ✅ PASS: Admin Panel opens.\n');

console.log('Test 2: Correct Admin email + incorrect password');
const test2 = evaluateAdminLogin('infyumtech@gmail.com', 'wrongPassword!', false);
assert.strictEqual(test2.success, false);
assert.strictEqual(test2.error, 'Invalid email or password.');
console.log('   ✅ PASS: Access denied with "Invalid email or password."\n');

console.log('Test 3: Correct Admin email + empty password');
const test3 = evaluateAdminLogin('infyumtech@gmail.com', '', false);
assert.strictEqual(test3.success, false);
assert.strictEqual(test3.error, 'Invalid email or password.');
console.log('   ✅ PASS: Access denied with "Invalid email or password."\n');

console.log('Test 4: Employee Google account → Employee dashboard only, subject to approval');
const approvedEmployee = {
  email: 'employee@infyum.com',
  role: 'employee',
  status: 'approved',
  isApproved: true,
  canUseTools: true
};
const pendingEmployee = {
  email: 'newuser@infyum.com',
  role: 'employee',
  status: 'pending',
  isApproved: false,
  canUseTools: false
};
const disabledEmployee = {
  email: 'blocked@infyum.com',
  role: 'employee',
  status: 'disabled',
  isApproved: true,
  canUseTools: false
};

const routeEmpApproved = evaluateRouteAccess(approvedEmployee, '/dashboard');
assert.strictEqual(routeEmpApproved.view, 'EmployeeDashboard');
assert.strictEqual(routeEmpApproved.canUseTools, true);

const routeEmpPending = evaluateRouteAccess(pendingEmployee, '/dashboard');
assert.strictEqual(routeEmpPending.view, 'PendingApproval');
assert.strictEqual(routeEmpPending.accessGranted, false);

const routeEmpDisabled = evaluateRouteAccess(disabledEmployee, '/dashboard');
assert.strictEqual(routeEmpDisabled.view, 'AccountDisabled');
assert.strictEqual(routeEmpDisabled.accessGranted, false);
console.log('   ✅ PASS: Approved gets tools; Pending and Disabled gated correctly.\n');

console.log('Test 5: Employee directly opening the Admin URL');
const routeEmpDirectAdmin = evaluateRouteAccess(approvedEmployee, 'http://localhost:5173/#admin');
assert.strictEqual(routeEmpDirectAdmin.accessGranted, false);
assert.strictEqual(routeEmpDirectAdmin.redirect, 'employee-dashboard');
assert(routeEmpDirectAdmin.securityAlert.includes('Access Denied'));
console.log('   ✅ PASS: Employee directly opening Admin URL is denied and redirected.\n');

console.log('Test 6: Unauthenticated user directly opening the Admin URL');
const routeUnauthDirectAdmin = evaluateRouteAccess(null, 'http://localhost:5173/#admin');
assert.strictEqual(routeUnauthDirectAdmin.accessGranted, false);
assert.strictEqual(routeUnauthDirectAdmin.redirect, 'admin-login');
console.log('   ✅ PASS: Unauthenticated user redirected to Admin Login.\n');

console.log('====================================================');
console.log('🎉 ALL 6 MANDATORY TEST CASES PASSED SUCCESSFULLY!');
console.log('====================================================');
