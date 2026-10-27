import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  projectId: 'fresh-nexus-75v9p',
  appId: '1:335748799876:web:2e2ca26623d2e56f6791d1',
  apiKey: 'AIzaSyDVhxXxaDpeiuj0WdArYkOQOOzAoNg6NJk',
  authDomain: 'fresh-nexus-75v9p.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-thieponlnntngthi-7150013d-11a3-4714-ab0b-607155d1b9f3',
  storageBucket: 'fresh-nexus-75v9p.firebasestorage.app',
  messagingSenderId: '335748799876',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

export { signInWithPopup, fbSignOut, onAuthStateChanged };
export type { FirebaseUser };

/**
 * Detects if current browser is an in-app browser (Zalo, Facebook, Messenger, Line, Instagram)
 * where Google Sign-in OAuth is blocked by Google.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !navigator || !navigator.userAgent) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /FBAN|FBAV|Instagram|Line|Zalo|MicroMessenger|TikTok/i.test(ua);
}

// Proactively clear stale unrefreshable auth credentials if Token Service API is not enabled
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await user.getIdToken();
      } catch (err: any) {
        const msg = String(err?.message || err?.code || err || '');
        if (
          msg.includes('token-service-api') ||
          msg.includes('securetoken.googleapis.com') ||
          msg.includes('SERVICE_DISABLED')
        ) {
          console.warn('[Firebase Auth] Token Service API disabled in project. Clearing stale session.');
          await fbSignOut(auth).catch(() => {});
        }
      }
    }
  });
}



