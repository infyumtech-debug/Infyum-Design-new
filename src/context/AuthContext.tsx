import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  employeeAuth, 
  adminAuth, 
  googleProvider, 
  isFirebaseConfigured, 
  ADMIN_EMAIL 
} from '../services/firebase';
import { 
  registerOrUpdateEmployee, 
  getEmployeeProfile, 
  logLoginActivity,
  verifyAndRecordAdmin
} from '../services/adminService';
import type { EmployeeUser, UserRole } from '../types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
}

export interface AuthContextType {
  // Session contexts
  user: AuthUser | null;              // Active user for the current tab/route
  adminUser: AuthUser | null;         // Isolated Admin user session
  employeeUser: AuthUser | null;      // Isolated Employee user session
  employeeProfile: EmployeeUser | null;

  // Permissions & State
  isAdmin: boolean;
  isEmployee: boolean;
  isApproved: boolean;
  canUseTools: boolean;

  // Loading & error
  isLoading: boolean;
  isAdminLoading: boolean;
  isEmployeeLoading: boolean;
  error: string | null;

  // Actions
  signInWithGoogle: (demoEmail?: string, demoName?: string) => Promise<void>;
  signInEmployeeWithEmail: (email: string, pass: string) => Promise<void>;
  signUpEmployeeWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInAdmin: (email: string, pass: string) => Promise<void>;
  employeeLogout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [employeeUser, setEmployeeUser] = useState<AuthUser | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeUser | null>(null);

  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(true);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track route hash to determine active context for generic helpers
  const [routeHash, setRouteHash] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.hash : '';
  });

  useEffect(() => {
    const handleHash = () => setRouteHash(window.location.hash);
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // 1. Employee Auth State Listener (Bound to employeeAuth on [DEFAULT] app)
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && employeeAuth) {
      // Check for redirect result if returned from Google OAuth redirect
      getRedirectResult(employeeAuth).catch(err => {
        console.warn('Redirect auth notice:', err);
      });

      unsubscribe = onAuthStateChanged(employeeAuth, async (fbUser: FirebaseUser | null) => {
        try {
          if (fbUser && fbUser.email) {
            const userEmail = fbUser.email.toLowerCase();
            const isAdminEmail = userEmail === ADMIN_EMAIL.toLowerCase();

            if (isAdminEmail) {
              const adminSession: AuthUser = {
                uid: fbUser.uid,
                email: ADMIN_EMAIL,
                displayName: fbUser.displayName || 'Infyum Administrator',
                photoURL: fbUser.photoURL || undefined,
                role: 'admin'
              };
              setAdminUser(adminSession);
              setEmployeeUser(adminSession);
              setEmployeeProfile({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Infyum Administrator',
                email: ADMIN_EMAIL,
                photoURL: fbUser.photoURL || '',
                status: 'approved',
                isApproved: true,
                canUseTools: true,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              });
              await verifyAndRecordAdmin(fbUser.uid, ADMIN_EMAIL);
            } else {
              // Genuine employee Google/email login
              const empUser: AuthUser = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || 'Infyum Employee',
                photoURL: fbUser.photoURL || undefined,
                role: 'employee'
              };
              setEmployeeUser(empUser);

              const prof = await registerOrUpdateEmployee({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Infyum Employee',
                email: fbUser.email,
                photoURL: fbUser.photoURL || undefined
              });
              setEmployeeProfile(prof);
            }
          } else {
            setEmployeeUser(null);
            setEmployeeProfile(null);
          }
        } catch (err) {
          console.error('Error handling employee auth state:', err);
          setEmployeeUser(null);
          setEmployeeProfile(null);
        } finally {
          setIsEmployeeLoading(false);
        }
      });
    } else {
      setIsEmployeeLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // 2. Admin Auth State Listener (Bound to adminAuth on infyumAdminApp)
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseConfigured && adminAuth) {
      unsubscribe = onAuthStateChanged(adminAuth, async (fbUser: FirebaseUser | null) => {
        try {
          if (fbUser && fbUser.email) {
            const userEmail = fbUser.email.toLowerCase();
            const isAdminEmail = userEmail === ADMIN_EMAIL.toLowerCase();
            const isPasswordProvider = fbUser.providerData.some(p => p.providerId === 'password');

            if (isAdminEmail && isPasswordProvider) {
              // Verify backend authorization in Firestore admin_users collection
              const verified = await verifyAndRecordAdmin(fbUser.uid, fbUser.email);
              if (verified) {
                setAdminUser({
                  uid: fbUser.uid,
                  email: fbUser.email,
                  displayName: fbUser.displayName || 'Infyum Administrator',
                  photoURL: fbUser.photoURL || undefined,
                  role: 'admin'
                });
              } else {
                console.warn('Backend admin role verification failed. Signing out adminAuth.');
                if (adminAuth) await firebaseSignOut(adminAuth);
                setAdminUser(null);
              }
            } else {
              console.warn('Invalid user or provider for adminAuth. Signing out.');
              if (adminAuth) await firebaseSignOut(adminAuth);
              setAdminUser(null);
            }
          } else {
            setAdminUser(null);
          }
        } catch (err) {
          console.error('Error handling admin auth state:', err);
          setAdminUser(null);
        } finally {
          setIsAdminLoading(false);
        }
      });
    } else {
      setIsAdminLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!employeeUser) return;
    const prof = await getEmployeeProfile(employeeUser.uid);
    setEmployeeProfile(prof);
  };

  // Employee Google Sign-In (Operates on employeeAuth with popup or redirect)
  const signInWithGoogle = async (demoEmail?: string, demoName?: string) => {
    setIsEmployeeLoading(true);
    setError(null);

    try {
      if (isFirebaseConfigured && employeeAuth && googleProvider) {
        let fbUser: FirebaseUser;
        try {
          const result = await signInWithPopup(employeeAuth, googleProvider);
          fbUser = result.user;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-blocked') {
            console.warn('Popup blocked, attempting redirect sign-in');
            await signInWithRedirect(employeeAuth, googleProvider);
            return;
          }
          throw popupErr;
        }

        const userEmail = (fbUser.email || '').toLowerCase();

        // If the authenticated user is the Administrator, authenticate as Admin seamlessly!
        if (userEmail === ADMIN_EMAIL.toLowerCase()) {
          const adminSession: AuthUser = {
            uid: fbUser.uid,
            email: ADMIN_EMAIL,
            displayName: fbUser.displayName || 'Infyum Administrator',
            photoURL: fbUser.photoURL || undefined,
            role: 'admin'
          };
          setAdminUser(adminSession);
          setEmployeeUser(adminSession);
          setEmployeeProfile({
            uid: fbUser.uid,
            name: fbUser.displayName || 'Infyum Administrator',
            email: ADMIN_EMAIL,
            photoURL: fbUser.photoURL || '',
            status: 'approved',
            isApproved: true,
            canUseTools: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          });
          await logLoginActivity(fbUser.uid, userEmail, 'admin_login');
          await verifyAndRecordAdmin(fbUser.uid, userEmail);
          return;
        }

        const employee = await registerOrUpdateEmployee({
          uid: fbUser.uid,
          name: fbUser.displayName || 'Infyum Employee',
          email: userEmail,
          photoURL: fbUser.photoURL || undefined
        });

        await logLoginActivity(fbUser.uid, userEmail, 'login');

        setEmployeeUser({
          uid: fbUser.uid,
          email: userEmail,
          displayName: fbUser.displayName || 'Infyum Employee',
          photoURL: fbUser.photoURL || undefined,
          role: 'employee'
        });
        setEmployeeProfile(employee);
      } else {
        // Fallback demo for employee testing
        const email = (demoEmail || 'sarah.jenkins@infyum.com').toLowerCase();
        const name = demoName || (email.split('@')[0].replace('.', ' ').toUpperCase());
        const uid = 'emp-' + btoa(email).substring(0, 10).replace(/=/g, '');

        if (email === ADMIN_EMAIL.toLowerCase()) {
          const adminSession: AuthUser = {
            uid,
            email: ADMIN_EMAIL,
            displayName: 'Infyum Administrator',
            role: 'admin'
          };
          setAdminUser(adminSession);
          setEmployeeUser(adminSession);
          return;
        }

        const employee = await registerOrUpdateEmployee({
          uid,
          name,
          email,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        });

        await logLoginActivity(uid, email, 'login');

        const sessionUser: AuthUser = {
          uid,
          email,
          displayName: name,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          role: 'employee'
        };

        setEmployeeUser(sessionUser);
        setEmployeeProfile(employee);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      let msg = 'Google sign-in failed. Please try again.';
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.17';

      if (err.code === 'auth/unauthorized-domain') {
        msg = `Domain not authorized in Firebase: "${currentHost}".\n\nTo enable Google Sign-In from this network computer:\n1. Open Firebase Console (https://console.firebase.google.com/)\n2. Select project "creative-studio-f19a6" -> Authentication -> Settings -> Authorized domains\n3. Click "Add domain" and enter "${currentHost}"\n4. Click Save.\n\nOr sign in directly using the "Email & Password" tab below with any personal email.`;
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by your browser. Please allow popups or use Email & Password below.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing authentication. Please try again.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection error. Please verify your connection to the server.';
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      throw err;
    } finally {
      setIsEmployeeLoading(false);
    }
  };

  // Employee Email/Password Sign-In (Operates on employeeAuth with smart auto-registration)
  const signInEmployeeWithEmail = async (emailInput: string, passwordInput: string) => {
    setIsEmployeeLoading(true);
    setError(null);
    const email = (emailInput || '').trim().toLowerCase();
    const password = (passwordInput || '').trim();

    if (!email || !password) {
      setIsEmployeeLoading(false);
      const msg = 'Please enter both your email address and password.';
      setError(msg);
      throw new Error(msg);
    }

    // Direct Administrator Authentication: Never block or show error message
    if (email === ADMIN_EMAIL.toLowerCase()) {
      try {
        await signInAdmin(email, password);
        const adminSession: AuthUser = {
          uid: adminUser?.uid || 'admin-root',
          email: ADMIN_EMAIL,
          displayName: 'Infyum Administrator',
          role: 'admin'
        };
        setEmployeeUser(adminSession);
        setEmployeeProfile({
          uid: adminSession.uid,
          name: 'Infyum Administrator',
          email: ADMIN_EMAIL,
          photoURL: '',
          status: 'approved',
          isApproved: true,
          canUseTools: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
        return;
      } catch (adminErr: any) {
        setIsEmployeeLoading(false);
        throw adminErr;
      }
    }

    try {
      if (isFirebaseConfigured && employeeAuth) {
        let fbUser: FirebaseUser;
        try {
          const result = await signInWithEmailAndPassword(employeeAuth, email, password);
          fbUser = result.user;
        } catch (signInErr: any) {
          // If the account does not exist yet in Firebase Auth, automatically register the personal account!
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            try {
              const regResult = await createUserWithEmailAndPassword(employeeAuth, email, password);
              fbUser = regResult.user;
              await updateProfile(fbUser, { displayName: email.split('@')[0] });
            } catch (regErr: any) {
              if (regErr.code === 'auth/email-already-in-use') {
                // The account DOES exist, which means the employee entered an incorrect password
                throw new Error('Incorrect password. Please verify your password and try again.');
              }
              if (regErr.code === 'auth/weak-password') {
                throw new Error('Password must be at least 6 characters.');
              }
              throw regErr;
            }
          } else {
            throw signInErr;
          }
        }

        const employee = await registerOrUpdateEmployee({
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email?.toLowerCase() || email,
          photoURL: fbUser.photoURL || undefined
        });
        await logLoginActivity(fbUser.uid, email, 'login');
        setEmployeeUser({
          uid: fbUser.uid,
          email,
          displayName: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL || undefined,
          role: 'employee'
        });
        setEmployeeProfile(employee);
      } else {
        const uid = 'emp-' + btoa(email).substring(0, 10).replace(/=/g, '');
        const name = email.split('@')[0].replace('.', ' ').toUpperCase();
        const employee = await registerOrUpdateEmployee({
          uid,
          name,
          email
        });
        await logLoginActivity(uid, email, 'login');
        setEmployeeUser({
          uid,
          email,
          displayName: name,
          role: 'employee'
        });
        setEmployeeProfile(employee);
      }
    } catch (err: any) {
      console.error('Employee email sign-in failed:', err);
      let msg = err.message || 'Failed to sign in. Please check your credentials.';

      if (err.code === 'auth/wrong-password') {
        msg = 'Incorrect password. Please verify your password and try again.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a few moments before trying again.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error: Unable to reach authentication server. Please check your network connection.';
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setIsEmployeeLoading(false);
    }
  };

  // Employee Email/Password Registration (Operates on employeeAuth)
  const signUpEmployeeWithEmail = async (emailInput: string, passwordInput: string, nameInput: string) => {
    setIsEmployeeLoading(true);
    setError(null);
    const email = (emailInput || '').trim().toLowerCase();
    const password = (passwordInput || '').trim();
    const name = (nameInput || '').trim();

    if (!email || !password || !name) {
      setIsEmployeeLoading(false);
      const msg = 'Please enter your full name, email address, and a secure password.';
      setError(msg);
      throw new Error(msg);
    }

    if (email === ADMIN_EMAIL.toLowerCase()) {
      try {
        await signInAdmin(email, password);
        return;
      } catch {
        if (adminAuth) {
          const result = await createUserWithEmailAndPassword(adminAuth, email, password);
          await updateProfile(result.user, { displayName: name });
          await verifyAndRecordAdmin(result.user.uid, email);
          await signInAdmin(email, password);
          return;
        }
      }
    }

    try {
      if (isFirebaseConfigured && employeeAuth) {
        const result = await createUserWithEmailAndPassword(employeeAuth, email, password);
        const fbUser = result.user;
        await updateProfile(fbUser, { displayName: name });
        const employee = await registerOrUpdateEmployee({
          uid: fbUser.uid,
          name,
          email,
          photoURL: fbUser.photoURL || undefined
        });
        await logLoginActivity(fbUser.uid, email, 'register_pending');
        setEmployeeUser({
          uid: fbUser.uid,
          email,
          displayName: name,
          role: 'employee'
        });
        setEmployeeProfile(employee);
      } else {
        const uid = 'emp-' + btoa(email).substring(0, 10).replace(/=/g, '');
        const employee = await registerOrUpdateEmployee({
          uid,
          name,
          email
        });
        await logLoginActivity(uid, email, 'register_pending');
        setEmployeeUser({
          uid,
          email,
          displayName: name,
          role: 'employee'
        });
        setEmployeeProfile(employee);
      }
    } catch (err: any) {
      console.error('Employee registration failed:', err);
      let msg = 'Failed to register account.';

      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please enter your password to sign in.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please enter at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password provider is not enabled in Firebase Console. Please enable Email/Password under Authentication > Sign-in method.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network error: Unable to reach authentication server.';
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      throw new Error(msg);
    } finally {
      setIsEmployeeLoading(false);
    }
  };

  // Dedicated Admin Login (Operates exclusively on adminAuth)
  const signInAdmin = async (emailInput: string, passwordInput: string) => {
    setIsAdminLoading(true);
    setError(null);

    const normalizedEmail = (emailInput || '').trim().toLowerCase();
    const cleanPassword = (passwordInput || '').trim();

    // 1. Validate inputs are non-empty
    if (!normalizedEmail || !cleanPassword) {
      setIsAdminLoading(false);
      const msg = 'Invalid email or password.';
      setError(msg);
      throw new Error(msg);
    }

    // 2. Strict Check: The ONLY authorized Admin email is infyumtech@gmail.com
    if (normalizedEmail !== ADMIN_EMAIL.toLowerCase()) {
      setIsAdminLoading(false);
      const msg = 'Invalid email or password.';
      setError(msg);
      throw new Error(msg);
    }

    // 3. Ensure Firebase Auth is initialized
    if (!isFirebaseConfigured || !adminAuth) {
      setIsAdminLoading(false);
      const msg = 'Firebase Authentication is not configured. Please verify your environment settings.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      // 4. Authenticate using Firebase Authentication's actual signInWithEmailAndPassword on adminAuth
      const userCredential = await signInWithEmailAndPassword(adminAuth, normalizedEmail, passwordInput);
      const fbUser = userCredential.user;

      if (!fbUser || fbUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        if (adminAuth) await firebaseSignOut(adminAuth);
        setAdminUser(null);
        throw new Error('Invalid email or password.');
      }

      // 5. Server-side backend authorization verification via Cloud Firestore admin_users
      const isVerifiedAdmin = await verifyAndRecordAdmin(fbUser.uid, fbUser.email);
      if (!isVerifiedAdmin) {
        if (adminAuth) await firebaseSignOut(adminAuth);
        setAdminUser(null);
        throw new Error('Admin role authorization failed on backend.');
      }

      const adminSession: AuthUser = {
        uid: fbUser.uid,
        email: ADMIN_EMAIL,
        displayName: 'Infyum Administrator',
        role: 'admin'
      };

      await logLoginActivity(fbUser.uid, ADMIN_EMAIL, 'admin_login');
      setAdminUser(adminSession);
    } catch (err: any) {
      console.error('Firebase Admin authentication failure:', err);
      setAdminUser(null);

      // Always display standardized, secure rejection message
      let message = 'Invalid email or password.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password (auth/invalid-credential).';
      } else if (err.code === 'auth/user-not-found') {
        message = 'Admin account not found in Firebase Authentication (auth/user-not-found).';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Access temporarily locked (auth/too-many-requests).';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error: Failed to communicate with Firebase Authentication.';
      } else if (err.code) {
        message = `Authentication error: ${err.message || err.code} (${err.code})`;
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
      throw new Error(message);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Dedicated Employee Logout (Affects ONLY employee session; leaves admin session completely untouched)
  const employeeLogout = async () => {
    setIsEmployeeLoading(true);
    try {
      if (employeeUser) {
        await logLoginActivity(employeeUser.uid, employeeUser.email, 'logout');
      }
      if (isFirebaseConfigured && employeeAuth) {
        await firebaseSignOut(employeeAuth);
      }
      setEmployeeUser(null);
      setEmployeeProfile(null);
    } catch (err) {
      console.error('Employee logout error:', err);
    } finally {
      setIsEmployeeLoading(false);
    }
  };

  // Dedicated Admin Logout (Affects ONLY admin session; leaves employee session completely untouched)
  const adminLogout = async () => {
    setIsAdminLoading(true);
    try {
      if (adminUser) {
        await logLoginActivity(adminUser.uid, adminUser.email, 'logout');
      }
      if (isFirebaseConfigured && adminAuth) {
        await firebaseSignOut(adminAuth);
      }
      setAdminUser(null);
    } catch (err) {
      console.error('Admin logout error:', err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Context-aware logout: signs out the appropriate session based on current tab route
  const logout = async () => {
    const isCurrentAdminRoute = routeHash.toLowerCase().includes('admin') || 
      (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('admin'));

    if (isCurrentAdminRoute) {
      await adminLogout();
    } else {
      await employeeLogout();
    }
  };

  const clearError = () => setError(null);

  const isAdminRoute = routeHash.toLowerCase().includes('admin') || 
    (typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('admin'));

  // The active user in this tab is adminUser if on an admin route, else employeeUser (or adminUser fallback)
  const isAdmin = Boolean(
    (adminUser?.role === 'admin' && adminUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (employeeUser?.role === 'admin' && employeeUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
    (employeeUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );
  const user = isAdminRoute ? (adminUser || employeeUser) : (employeeUser || adminUser);
  const isEmployee = Boolean(employeeUser?.role === 'employee' || isAdmin);
  const isApproved = isAdmin || Boolean(employeeProfile?.isApproved && employeeProfile?.status === 'approved');
  const canUseTools = isAdmin || Boolean(employeeProfile?.canUseTools && isApproved);
  const isLoading = isAdminRoute ? isAdminLoading : isEmployeeLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        employeeUser,
        employeeProfile,
        isAdmin,
        isEmployee,
        isApproved,
        canUseTools,
        isLoading,
        isAdminLoading,
        isEmployeeLoading,
        error,
        signInWithGoogle,
        signInEmployeeWithEmail,
        signUpEmployeeWithEmail,
        signInAdmin,
        employeeLogout,
        adminLogout,
        logout,
        refreshProfile,
        clearError,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
