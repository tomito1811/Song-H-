import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

// Load firebase applet configuration
let firebaseConfig: any = {
  projectId: 'fresh-nexus-75v9p',
  firestoreDatabaseId: 'ai-studio-thieponlnntngthi-7150013d-11a3-4714-ab0b-607155d1b9f3',
};

try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json, using defaults:', e);
}

// Initialize Firebase Admin once
const app: App = getApps().length > 0
  ? getApp()
  : initializeApp({
      projectId: firebaseConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'fresh-nexus-75v9p',
    });

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Helper to check if an email has admin privileges
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  
  const configuredAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  const defaultAdmins = ['admin@thieponl.vn', 'contact.media.vnn@gmail.com'];
  const allAdmins = new Set([...configuredAdmins, ...defaultAdmins]);

  return allAdmins.has(normalized);
}

// Augmented Request interface
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
    isAdmin: boolean;
  };
}

// Express middleware: Requires valid Firebase ID token
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      displayName: decoded.name || decoded.email?.split('@')[0] || 'Cặp Đôi',
      photoURL: decoded.picture || '',
      isAdmin: isAdminEmail(decoded.email),
    };
    next();
  } catch (error: any) {
    console.error('Firebase token verification error:', error.message || error);
    return res.status(401).json({
      success: false,
      message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
    });
  }
}

// Express middleware: Optional token
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name,
        photoURL: decoded.picture,
        isAdmin: isAdminEmail(decoded.email),
      };
    } catch {
      // Proceed without user
    }
  }
  next();
}

// Express middleware: Admin only
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập khu vực Quản trị viên (Admin).',
      });
    }
    next();
  });
}
