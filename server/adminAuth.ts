import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { AdminUser } from '../src/types/store.ts';
import { getDb } from './db.ts';

export const ADMIN_SESSION_COOKIE = 'mk_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticatedAdminRequest extends Request {
  adminUser?: AdminUser;
  adminSessionToken?: string;
}

function hashPasswordWithSalt(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPasswordHash(password: string, salt: string, storedHashHex: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHashHex, 'hex');
  if (computed.length !== stored.length) return false;
  return crypto.timingSafeEqual(computed, stored);
}

export function ensureInitialAdminUser(): void {
  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) AS cnt FROM admin_users').get();
  if (Number(countRow?.cnt ?? 0) > 0) return;

  const email = (process.env.ADMIN_EMAIL || 'abc123@gmail.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '12345#@';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasswordWithSalt(password, salt);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, password_salt, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'Owner', ?, ?)
  `).run('admin-owner-1', email, hash, salt, now, now);
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

export function loginAdmin(
  emailInput: string,
  passwordInput: string
): { token: string; user: AdminUser } | null {
  ensureInitialAdminUser();
  const db = getDb();
  const email = emailInput.trim().toLowerCase();
  if (!email || !passwordInput) return null;

  const row = db.prepare('SELECT * FROM admin_users WHERE LOWER(email) = ? LIMIT 1').get(email);
  if (!row) return null;

  const valid = verifyPasswordHash(
    passwordInput,
    String(row.password_salt),
    String(row.password_hash)
  );
  if (!valid) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();

  // Purge expired sessions opportunistically
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(createdAt);

  db.prepare(`
    INSERT INTO admin_sessions (token, admin_id, email, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, String(row.id), String(row.email), createdAt, expiresAt);

  return {
    token,
    user: {
      id: String(row.id),
      email: String(row.email),
      role: String(row.role),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    },
  };
}

export function getAdminSession(token: string | undefined): AdminUser | null {
  if (!token) return null;
  ensureInitialAdminUser();
  const db = getDb();
  const nowIso = new Date().toISOString();

  const row = db
    .prepare(`
      SELECT u.id, u.email, u.role, u.created_at, u.updated_at, s.expires_at
      FROM admin_sessions s
      JOIN admin_users u ON u.id = s.admin_id
      WHERE s.token = ?
      LIMIT 1
    `)
    .get(token);

  if (!row) return null;
  if (String(row.expires_at) <= nowIso) {
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    id: String(row.id),
    email: String(row.email),
    role: String(row.role),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function logoutAdminSession(token: string | undefined): void {
  if (!token) return;
  const db = getDb();
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

export function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
  currentToken?: string
): { ok: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters.' };
  }
  const db = getDb();
  const row = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(adminId);
  if (!row) {
    return { ok: false, error: 'Admin account not found.' };
  }

  const valid = verifyPasswordHash(
    currentPassword,
    String(row.password_salt),
    String(row.password_hash)
  );
  if (!valid) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPasswordWithSalt(newPassword, salt);
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE admin_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?'
  ).run(hash, salt, now, adminId);

  if (currentToken) {
    db.prepare('DELETE FROM admin_sessions WHERE admin_id = ? AND token != ?').run(
      adminId,
      currentToken
    );
  }

  return { ok: true };
}

function isHttpsRequest(req: Request): boolean {
  const xfProto = req.headers['x-forwarded-proto'];
  if (typeof xfProto === 'string' && xfProto.toLowerCase().includes('https')) {
    return true;
  }
  if (req.secure) return true;
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.startsWith('https://')) {
    return true;
  }
  return false;
}

export function extractAdminToken(req: Request): string | undefined {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[ADMIN_SESSION_COOKIE]) {
    return cookies[ADMIN_SESSION_COOKIE];
  }
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  return undefined;
}

export function setAdminSessionCookie(req: Request, res: Response, token: string): void {
  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
  const https = isHttpsRequest(req);
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax',
    ...(https ? ['Secure', 'Partitioned'] : []),
    `Max-Age=${maxAgeSec}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    https ? 'SameSite=None' : 'SameSite=Lax',
    ...(https ? ['Secure', 'Partitioned'] : []),
    'Max-Age=0',
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function requireAdminAuth(
  req: AuthenticatedAdminRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractAdminToken(req);
  const user = getAdminSession(token);
  if (!user) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  req.adminUser = user;
  req.adminSessionToken = token;
  next();
}
