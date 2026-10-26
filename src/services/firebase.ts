import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  type Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  type Firestore 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if valid Firebase credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'your-firebase-api-key' &&
  !firebaseConfig.apiKey.includes('placeholder')
);

let employeeApp: FirebaseApp | null = null;
let employeeAuth: Auth | null = null;
let employeeDb: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

let adminApp: FirebaseApp | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const existingApps = getApps();

    // 1. Employee Firebase App ([DEFAULT])
    employeeApp = existingApps.find(a => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
    employeeAuth = getAuth(employeeApp);
    employeeDb = getFirestore(employeeApp);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    // 2. Admin Firebase App (Dedicated isolated named app: 'infyumAdminApp')
    // Having a separate Firebase App provides dedicated IndexedDB token persistence,
    // completely preventing Employee Google sign-in/out from altering the Admin session.
    adminApp = existingApps.find(a => a.name === 'infyumAdminApp') || initializeApp(firebaseConfig, 'infyumAdminApp');
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.warn('Firebase initialization error, running in demo/fallback mode:', error);
  }
}

// Backwards-compatible aliases (defaults to employeeApp)
export { 
  employeeApp as app, 
  employeeAuth as auth, 
  employeeDb as db,
  employeeApp,
  employeeAuth,
  employeeDb,
  adminApp,
  adminAuth,
  adminDb,
  googleProvider 
};
export const ADMIN_EMAIL = 'infyumtech@gmail.com';

