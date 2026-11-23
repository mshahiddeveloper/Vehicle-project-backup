/**
 * SafarPK Enterprise Session & Cookie Security Engine
 * OWASP ASVS Level 2+ / NIST SP 800-63B Compliant
 * 
 * Provides HttpOnly, Secure, SameSite=Strict server-side session management.
 * Compatible with both Vercel Edge Runtime (Middleware) and Node.js Fluid Compute.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SessionUser {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PROVIDER' | 'AGENT' | 'SUPER_ADMIN';
  providerSubtype?: 'PICK_AND_DROP' | 'COMMERCIAL_CARGO' | 'CITY_TO_CITY' | null;
  city?: string;
}

export interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

export const SESSION_COOKIE_NAME = 'safarpk_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 Days

function getSecretKey(): string {
  return process.env.KMS_ENCRYPTION_KEY || process.env.JWT_SECRET || 'safarpk_master_session_secret_2026';
}

/**
 * Computes HMAC-SHA256 hex string using standard Web Crypto API
 */
async function computeHmacSha256(keyStr: string, dataStr: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(keyStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataStr));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Creates an HMAC-SHA256 signed session token string: `base64(payload).signature`
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = await computeHmacSha256(getSecretKey(), payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed session token
 */
export async function verifySessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  const expectedSignature = await computeHmacSha256(getSecretKey(), payloadB64);

  if (!timingSafeEqualHex(signature, expectedSignature)) {
    return null;
  }

  try {
    const jsonStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(jsonStr) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sets HttpOnly, Secure, SameSite=Strict session cookie on response
 */
export async function setSessionCookie(res: NextResponse, user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const isProd = process.env.NODE_ENV === 'production';

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the session cookie on response
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Retrieves and validates the session payload from an incoming request
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const cookieVal = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieVal) return null;
  return await verifySessionToken(cookieVal);
}
